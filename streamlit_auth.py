
import streamlit as st
import os
import time
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

from chunking import extract_hierarchy, extract_hierarchy_from_markdown, chunk_hierarchy_for_rag
from vectorstore import InMemoryVectorStore

# -------------------------------------------------------------------
# Landing Page / Document Upload
# -------------------------------------------------------------------
def landing_page():
    """
    Displays the landing page where users can upload a document to start the chat.
    If a document is already processed and session is authenticated, returns True.
    """
    
    # 1. Check if already authenticated (document loaded)
    if st.session_state.get("authenticated", False):
        return True

    st.title("📂 RAG Chatbot - Document Upload")
    st.write("Upload a document (Text, Markdown, or HTML) to start chatting with it.")

    # 2. File Uploader
    uploaded_file = st.file_uploader("Choose a file", type=["txt", "md", "html"])

    if uploaded_file is not None:
        process_button = st.button("🚀 Process & Start Chat")
        
        if process_button:
            try:
                with st.spinner("Processing document..."):
                    # Read file content
                    # Identify encoding? Default to utf-8, fallback to latin-1 if needed
                    try:
                        file_text = uploaded_file.read().decode("utf-8")
                    except UnicodeDecodeError:
                        uploaded_file.seek(0)
                        file_text = uploaded_file.read().decode("latin-1")
                    
                    filename = uploaded_file.name
                    file_ext = filename.split(".")[-1].lower()
                    
                    # 1. Parse into Hierarchy
                    if file_ext == "md":
                        hierarchy = extract_hierarchy_from_markdown(file_text)
                    elif file_ext == "html":
                        hierarchy = extract_hierarchy(file_text)
                    else:
                        # TXT: Treat as one big chunk or split by paragraphs?
                        # Reusing the hierarchy structure: generic "Document" heading
                        hierarchy = [{
                            "h1": "Document Content", 
                            "h2": None, 
                            "h3": None, 
                            "h4": None, 
                            "content": line
                        } for line in file_text.splitlines() if line.strip()]

                    # 2. Chunking
                    # Note: chunk_hierarchy_for_rag expects a specific list of dict formats
                    chunks = chunk_hierarchy_for_rag(hierarchy)
                    
                    if not chunks:
                        st.error("No content found in the document.")
                        return False

                    # 3. Generate Embeddings (Batched)
                    # We need an API Key for this. Using system env or failing.
                    # Ideally, we should check for API KEY here.
                    api_key = os.getenv("OPENAI_API_KEY")
                    if not api_key:
                        # Fallback: Ask user for key if not in env? 
                        # For now assuming env is set as per previous config.
                        pass

                    client = OpenAI(api_key=api_key)
                    
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
                                model="text-embedding-3-small" # Hardcoded model
                            )
                            
                            # Assign embeddings back to chunks
                            for j, data_item in enumerate(response.data):
                                batch[j]["embedding"] = data_item.embedding
                                
                        except Exception as e:
                            st.error(f"Error embedding batch {i}: {e}")
                            return False

                        # Update progress
                        progress = min((i + batch_size) / total_chunks, 1.0)
                        progress_bar.progress(progress, text=f"Embedded {min(i + batch_size, total_chunks)}/{total_chunks} chunks")
                    
                    progress_bar.empty()
                    
                    # 4. Store in Vectorstore
                    # Reset vectorstore for new session
                    st.session_state["vectorstore"] = InMemoryVectorStore()
                    st.session_state["vectorstore"].add_document(doc_id=filename, file_name=filename, chunk_list=chunks)
                    
                    # 5. Set Session State
                    st.session_state["authenticated"] = True
                    st.session_state["user_doc_id"] = filename
                    
                    st.success("Document processed successfully!")
                    time.sleep(1)
                    st.rerun()
                    
            except Exception as e:
                st.error(f"An error occurred: {e}")

    # Stop execution if not authenticated
    st.info("Please upload a file to proceed.")
    st.stop()
    return False

def add_logout_button():
    """Add a Reset button to the sidebar to upload a new file."""
    if st.session_state.get("authenticated"):
        doc_id = st.session_state.get("user_doc_id", "Document")
        st.sidebar.info(f"📄 Active File: {doc_id}")
        if st.sidebar.button("⬆️ Upload New File"):
            st.session_state.clear()
            st.rerun()
