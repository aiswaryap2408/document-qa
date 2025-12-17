
import streamlit as st
import os
import time
import sys
import requests
import json
from urllib.parse import unquote_plus
import concurrent.futures
import threading
import random
from pymongo import MongoClient
from openai import OpenAI
from chunking import extract_hierarchy, chunk_hierarchy_for_rag
from vectorstore import InMemoryVectorStore

# -------------------------------------------------------------------
# MongoDB Connection
# -------------------------------------------------------------------
@st.cache_resource
def get_db_collection():
    # Use environment variable or default local
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    client = MongoClient(uri)
    db = client["auth_db"]
    return db["users"]

# -------------------------------------------------------------------
# Mock Webservice (Astrology Engine)
# -------------------------------------------------------------------
def generate_astrology_report(name, gender, dob, tob, pob, mobile):
    """
    Call ClickAstro API to generate report.
    """
    try:
        # 1. Prepare Data
        year, month, day = dob.split("-")
        
        # Gender mapping
        sex = gender if gender in ["Male", "Female"] else "Male" # Default fallback
        
        # Email - User snippet had {email}. We don't have email in arguments. 
        # Attempt to derive or use dummy as we don't collect email yet.
        email = f"{mobile}.user@example.com" 

        # 2. Construct XML
        # Note: XML string content indentation doesn't matter for XML parsing usually, 
        # but for code looks it should be clean.
        xml = f"""<DATA><BIRTHDATA><SEX>{sex}</SEX><NAME>{name}</NAME><DAY>{day}</DAY><MONTH>{month}</MONTH><YEAR>{year}</YEAR><TIME24HR>{tob}</TIME24HR><CORR>1</CORR><PLACE>Kochi</PLACE><LONG>076.40</LONG><LAT>09.13</LAT><LONGDIR>E</LONGDIR><LATDIR>N</LATDIR><TZONE>05.30</TZONE><TZONEDIR>E</TZONEDIR></BIRTHDATA><OPTIONS><CHARTSTYLE>1</CHARTSTYLE><CHARTBORDERSTYLE>1</CHARTBORDERSTYLE><VARIANT>V0</VARIANT><LANGUAGE>ENG</LANGUAGE><REPTYPE>CC-AI</REPTYPE><REPFORMAT>HTM</REPFORMAT><CLNTID>CLICKASTRO</CLNTID><ORDID/><HSETTINGS><AYANAMSA>1</AYANAMSA><DASASYSTEM>1</DASASYSTEM><SHOWGULIKAN>1</SHOWGULIKAN><GULIKATYPE>1</GULIKATYPE><PARYANTHARSTART>0</PARYANTHARSTART><PARYANTHAREND>25</PARYANTHAREND><FAVMARPERIOD>50</FAVMARPERIOD><BHAVABALAMETHOD>1</BHAVABALAMETHOD><YEARSPREVDASAPREDREQD>0</YEARSPREVDASAPREDREQD><SUNRISEMETHOD>1</SUNRISEMETHOD><BHAVATYPE>2</BHAVATYPE><ADVANCEDOPTION1>0</ADVANCEDOPTION1><ADVANCEDOPTION2>0</ADVANCEDOPTION2><ADVANCEDOPTION3>0</ADVANCEDOPTION3><ADVANCEDOPTION4>0</ADVANCEDOPTION4></HSETTINGS><EMAIL>sample@av.com</EMAIL></OPTIONS></DATA>"""

        # DEBUG: Show XML in UI
        st.subheader("Generated XML Payload")
        st.code(xml, language='xml')
        # st.stop() # Uncomment to stop here and check XML


        # 3. Call API
        st.info("Calling Astrology API...")
        url = "https://api.ccrdev.clickastro.com/chat/api.php"
        # We will try sending raw XML body
        # Try form data with key 'xml' (common convention)
        headers = {
            "User-Agent": "Mozilla/5.0", # Avoid bot blocking
        }
        payload = {'xml': xml} 
        
        # st.write("Sending as param 'xml'...")
        response = requests.post(
            url,
            data=payload,
            headers=headers,
            timeout=30
        )
        
        # 4. Handle Response
        if response.status_code == 200:
            try:
                json_response = response.json()
                
                # Check for mainHtml and decode it
                if "mainHtml" in json_response:
                    return unquote_plus(json_response["mainHtml"])
                
                return json.dumps(json_response, indent=2)
            except Exception as e:
                # Not JSON?
                raise ValueError(f"API returned non-JSON response. Raw output: {response.text}")
        else:
            raise requests.exceptions.RequestException(f"API Error: {response.status_code} - {response.text}")

    except Exception as e:
        raise RuntimeError(f"Failed to generate report: {e}")

# -------------------------------------------------------------------
# Helper: Streaming Facts & Background Task
# -------------------------------------------------------------------



# -------------------------------------------------------------------
# Auth Flow Logic
# -------------------------------------------------------------------
def require_auth():
    """
    Handles the complete authentication flow:
    1. Mobile Number Input
    2. OTP Verification
    3. New User -> Birth Details -> Generate Report -> Store -> RAG
    4. Existing User -> Login
    """
    
    # 1. Check if already authenticated
    if st.session_state.get("authenticated", False):
        return True

    st.title("🔐 Login to Astrology Bot")

    # Initialize Auth State
    if "auth_step" not in st.session_state:
        st.session_state["auth_step"] = "mobile" # mobile, otp, details

    # -----------------------------------------------------------
    # STEP 1: Mobile Number
    # -----------------------------------------------------------
    if st.session_state["auth_step"] == "mobile":
        with st.form("mobile_form"):
            mobile = st.text_input("Enter Mobile Number", max_chars=10, placeholder="9999999999")
            submit = st.form_submit_button("Get OTP")
            
            if submit and len(mobile) == 10:
                st.session_state["auth_mobile"] = mobile
                st.session_state["auth_step"] = "otp"
                st.success(f"OTP sent to {mobile}")
                st.rerun()
            elif submit:
                st.error("Please enter a valid 10-digit mobile number.")

    # -----------------------------------------------------------
    # STEP 2: OTP Verification
    # -----------------------------------------------------------
    elif st.session_state["auth_step"] == "otp":
        st.subheader(f"Verify OTP for {st.session_state['auth_mobile']}")
        
        with st.form("otp_form"):
            otp = st.text_input("Enter OTP (Use 1234)", max_chars=4)
            submit = st.form_submit_button("Verify OTP")
            back = st.form_submit_button("Back")

            if back:
                st.session_state["auth_step"] = "mobile"
                st.rerun()

            if submit:
                if otp == "1234":
                    # Check DB for user
                    users_col = get_db_collection()
                    mobile = st.session_state["auth_mobile"]
                    user = users_col.find_one({"mobile": mobile})

                    if user:
                        # EXISTING USER
                        st.session_state["authenticated"] = True
                        st.session_state["user_mobile"] = mobile
                        st.session_state["user_doc_id"] = mobile # The report doc ID is the mobile number
                        
                        # Force reload of vectorstore
                        if "vectorstore" in st.session_state:
                            del st.session_state["vectorstore"]

                        st.success("Welcome back!")
                        st.rerun()
                    else:
                        # NEW USER
                        st.session_state["auth_step"] = "details"
                        st.rerun()
                else:
                    st.error("Invalid OTP. Please try '1234'.")

    # -----------------------------------------------------------
    # STEP 3: Birth Details (New Users)
    # -----------------------------------------------------------
    elif st.session_state["auth_step"] == "details":
        st.subheader("✨ Welcome! Please provide your birth details.")
        
        with st.form("birth_details_form"):
            name = st.text_input("Full Name")
            # Date Input with correct range
            import datetime
            min_date = datetime.date(1980, 1, 1)
            max_date = datetime.date.today()
            default_date = datetime.date(2000, 1, 1)
            
            dob = st.date_input(
                "Date of Birth",
                value=default_date,
                min_value=min_date,
                max_value=max_date
            )
            tob = st.time_input("Time of Birth")
            gender = st.selectbox("Gender", ["Male", "Female", "Other"])
            pob = st.text_input("Place of Birth (City, Country)")
            
            submit = st.form_submit_button("Generate My Horoscope")

            if submit:
                if name and pob:
                    with st.spinner("Consulting the stars and generating your report..."):
                        mobile = st.session_state["auth_mobile"]
                        
                        # 1. Generate Report
                        tob_str = tob.strftime("%H.%M.%S")
                        report_text = generate_astrology_report(name, gender, str(dob), tob_str, pob, mobile)

                        # Save to file
                        os.makedirs("reports", exist_ok=True)
                        with open(f"reports/{mobile}.txt", "w", encoding="utf-8") as f:
                            f.write(report_text)
                        
                        # 2. Store in MongoDB
                        users_col = get_db_collection()
                        user_doc = {
                            "mobile": mobile,
                            "name": name,
                            "gender": gender,
                            "dob": str(dob),
                            "tob": tob_str,
                            "pob": pob,
                            "report_text": report_text,
                            "processed_doc_id": mobile,
                            "created_at": time.time()
                        }
                        users_col.insert_one(user_doc)
                        
                        # 3. Process for RAG
                        # Create a temporary vectorstore instance to process this doc
                        # This writes the JSON to disk, which the main app will load
                        temp_vs = InMemoryVectorStore() 
                        
                        # Chunking (HTML)
                        hierarchy = extract_hierarchy(report_text)
                        chunks = chunk_hierarchy_for_rag(hierarchy)

                        # Generate Embeddings (Batched)
                        client = OpenAI()
                        
                        # Prepare batches
                        batch_size = 20
                        total_chunks = len(chunks)
                        
                        progress_bar = st.progress(0, text="Generating embeddings...")
                        
                        for i in range(0, total_chunks, batch_size):
                            batch = chunks[i : i + batch_size]
                            inputs = [c["text"] for c in batch]
                            
                            try:
                                response = client.embeddings.create(
                                    input=inputs,
                                    model="text-embedding-3-small"
                                )
                                
                                # Assign embeddings back to chunks
                                for j, data_item in enumerate(response.data):
                                    batch[j]["embedding"] = data_item.embedding
                                    
                            except Exception as e:
                                print(f"Error embedding batch {i}: {e}")
                                # handling failure for batch
                                for c in batch:
                                    c["embedding"] = []

                            # Update progress
                            progress = min((i + batch_size) / total_chunks, 1.0)
                            progress_bar.progress(progress, text=f"Embedded {min(i + batch_size, total_chunks)}/{total_chunks} chunks")
                        
                        progress_bar.empty()
                        
                        # Add to store (saves to processed_docs/{mobile}.json)
                        temp_vs.add_document(doc_id=mobile, file_name=f"reports/{mobile}.txt", chunk_list=chunks)
                        
                        # 4. Finalize Auth
                        st.session_state["authenticated"] = True
                        st.session_state["user_mobile"] = mobile
                        st.session_state["user_doc_id"] = mobile
                        
                        # Force reload of vectorstore to pick up new file
                        if "vectorstore" in st.session_state:
                            del st.session_state["vectorstore"]

                        st.success("Horoscope handled! Redirecting...")
                        time.sleep(1)
                        st.rerun()
                else:
                    st.error("Please fill in all details.")

    # Stop execution if not authenticated
    st.stop()
    return False

def add_logout_button():
    """Add a logout button to the sidebar."""
    if st.session_state.get("authenticated"):
        st.sidebar.success(f"👤 Logged in: {st.session_state.get('user_mobile')}")
        if st.sidebar.button("Logout"):
            st.session_state.clear()
            st.rerun()
