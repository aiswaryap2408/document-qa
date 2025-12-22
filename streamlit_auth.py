
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
import re
from backend.db import get_db_collection
from backend.astrology_service import generate_astrology_report

# -------------------------------------------------------------------
# MongoDB Connection
# -------------------------------------------------------------------
# -------------------------------------------------------------------
# MongoDB Connection & Astrology Engine moved to backend/
# -------------------------------------------------------------------

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

    # -------------------------------------------------------------------
    # Modern CSS Injection
    # -------------------------------------------------------------------
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif;
        }

        /* Input Fields */
        .stTextInput input, .stDateInput input, .stTimeInput input, .stSelectbox [data-baseweb="select"] {
            border-radius: 8px !important;
            border: 1px solid #E0E0E0 !important;
            padding: 10px 12px !important;
            font-size: 16px !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }

        .stTextInput input:focus, .stDateInput input:focus {
            border-color: #4F46E5 !important;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2) !important;
        }

        /* Primary Button */
        div.stButton > button {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%) !important;
            color: white !important;
            border: none !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            width: 100% !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3) !important;
        }

        div.stButton > button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.4) !important;
        }

        div.stButton > button:active {
            transform: translateY(0);
        }

        /* Login Card Title */
        h1 {
            color: #111827 !important;
            font-weight: 700 !important;
            font-size: 28px !important;
            text-align: center !important;
            margin-bottom: 24px !important;
        }

        /* Success/Error Messages */
        .stAlert {
            border-radius: 8px;
        }
        </style>
    """, unsafe_allow_html=True)


    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        with st.container(border=True):
            st.title("Login")

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
                st.subheader("Welcome! Please provide your birth details.")
                
                with st.form("birth_details_form"):
                    name = st.text_input("Full Name")
                    email = st.text_input("Email Address")
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
                    gender = st.radio("Gender", ["Male", "Female"], horizontal=True)
                    chart_style = st.selectbox(
                        "Preferred Chart Style", 
                        ["South Indian", "North Indian", "East Indian", "Kerala"]
                    )
                    pob = st.text_input("Place of Birth (City, Country)")
                    
                    submit = st.form_submit_button("Generate My Horoscope")

                    if submit:
                        # Email Validation Regex
                        email_pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
                        
                        if not (name and pob and email):
                            st.error("Please fill in all details.")
                        elif not re.match(email_pattern, email):
                            st.error("Please enter a valid email address.")
                        else:
                            with st.spinner("Consulting the stars and generating your report..."):
                                mobile = st.session_state["auth_mobile"]
                                
                                # 1. Generate Report
                                tob_str = tob.strftime("%H.%M.%S")
                                report_text = generate_astrology_report(name, gender, str(dob), tob_str, pob, mobile, email, chart_style)

                                # Save to file
                                os.makedirs("reports", exist_ok=True)
                                with open(f"reports/{mobile}.txt", "w", encoding="utf-8") as f:
                                    f.write(report_text)
                                
                                # 2. Store in MongoDB
                                users_col = get_db_collection()
                                user_doc = {
                                    "mobile": mobile,
                                    "name": name,
                                    "email": email,
                                    "gender": gender,
                                    "chart_style": chart_style,
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
