import streamlit as st
import os
from chunking import extract_hierarchy, extract_hierarchy_from_markdown, chunk_hierarchy_for_rag
from vectorstore import InMemoryVectorStore
from rag_engine import RAGEngine
from openai import OpenAI
from streamlit_auth import require_auth, add_logout_button

st.set_page_config(page_title="RAG Document Processor", layout="wide")

require_auth()
add_logout_button()
# ----------------------------------------------------------
# Load Vectorstore
# ----------------------------------------------------------
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()

vectorstore = st.session_state["vectorstore"]
rag = RAGEngine(vectorstore)


# ----------------------------------------------------------
# Page Title
# ----------------------------------------------------------
st.title("📄 RAG Document Processor")


# ----------------------------------------------------------
# File Upload
# ----------------------------------------------------------
uploaded_file = st.file_uploader("Upload .txt / .md / .html", type=["txt", "md", "html"])

if uploaded_file:

    file_name = uploaded_file.name
    doc_id = os.path.splitext(file_name)[0]

    st.write(f"### Processing Document: **{doc_id}**")

    raw = uploaded_file.read().decode("utf-8", errors="ignore")

    # ----------------------------------------------------------
    # Detect file format
    # ----------------------------------------------------------
    if file_name.endswith(".md"):
        records = extract_hierarchy_from_markdown(raw)
    else:
        records = extract_hierarchy(raw)

    st.write(f"Extracted {len(records)} structural items.")

    # ----------------------------------------------------------
    # Chunking
    # ----------------------------------------------------------
    chunks = chunk_hierarchy_for_rag(records, chunk_size=1000, overlap=200)

    st.write(f"Created **{len(chunks)}** chunks.")

    # ----------------------------------------------------------
    # Embed Chunks
    # ----------------------------------------------------------
    embedded_chunks = []
    client = OpenAI()

    for i, c in enumerate(chunks):
        emb = client.embeddings.create(
            model="text-embedding-3-small",
            input=c["text"]
        ).data[0].embedding

        embedded_chunks.append({
            "heading": c["heading"],
            "text": c["text"],
            "embedding": emb,
            "doc_id": doc_id,
            "chunk_index": i
        })

    # ----------------------------------------------------------
    # Save JSON
    # ----------------------------------------------------------
    vectorstore.add_document(doc_id, file_name, embedded_chunks)
    
    # Link to user profile if logged in
    user_email = st.session_state.get("user_email")
    if user_email:
        try:
            from auth_pages.auth import add_user_document
            json_filename = f"{doc_id}.json"
            add_user_document(user_email, json_filename)
            st.success(f"Document linked to user profile: {user_email}")
        except Exception as e:
            st.warning(f"Could not link document to user profile: {e}")

    st.success(f"Document `{doc_id}` processed and saved!")


# ----------------------------------------------------------
# List Processed Documents
# ----------------------------------------------------------
st.subheader("📚 Processed Documents")

# Filter documents by user
user_email = st.session_state.get("user_email")
user_docs_ids = []

if user_email:
    from auth_pages.auth import get_user_documents
    user_docs = get_user_documents(user_email)
    allowed_ids = {d.replace(".json", "") for d in user_docs}
    user_docs_ids = [d for d in vectorstore.document_names if d in allowed_ids]
else:
    user_docs_ids = []

if user_docs_ids:
    for d in user_docs_ids:
        st.write(f"• {d}")
else:
    st.info("No documents processed yet.")

# ----------------------------------------------------------
# Delete Document
# ----------------------------------------------------------
with st.expander("🗑️ Delete Document"):
    if user_docs_ids:
        del_name = st.selectbox("Select Document", user_docs_ids)

        if st.button("Delete"):
            vectorstore.delete_document(del_name)
            # Note: We are not currently removing it from MongoDB list, 
            # but it won't show up here anyway since it's gone from vectorstore.
            st.success(f"Deleted {del_name}")
            st.rerun()
    else:
        st.info("No documents to delete.")
