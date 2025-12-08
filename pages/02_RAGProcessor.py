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
    chunks = chunk_hierarchy_for_rag(records, chunk_size=1500, overlap=300)

    st.write(f"Created **{len(chunks)}** chunks.")

    # ----------------------------------------------------------
    # Embed Chunks (Batched)
    # ----------------------------------------------------------
    embedded_chunks = []
    client = OpenAI()
    
    # Prepare all texts for a single batch call
    all_texts = [c["text"] for c in chunks]
    
    try:
        # Call OpenAI API with list of texts
        resp = client.embeddings.create(
            model="text-embedding-3-small",
            input=all_texts
        )
        
        # Extract embeddings
        embeddings = [d.embedding for d in resp.data]
        
        # Combine with chunk metadata
        for i, (c, emb) in enumerate(zip(chunks, embeddings)):
            embedded_chunks.append({
                "heading": c["heading"],
                "text": c["text"],
                "embedding": emb,
                "doc_id": doc_id,
                "chunk_index": i
            })
            
    except Exception as e:
        st.error(f"Error generating embeddings: {e}")
        st.stop()

    # ----------------------------------------------------------
    # Save JSON
    # ----------------------------------------------------------
    vectorstore.add_document(doc_id, file_name, embedded_chunks)
    
    st.success(f"Document `{doc_id}` processed and saved!")


# ----------------------------------------------------------
# List Processed Documents
# ----------------------------------------------------------
st.subheader("📚 Processed Documents")

# For single-user app, show all documents
all_docs = vectorstore.document_names

if all_docs:
    for d in all_docs:
        st.write(f"• {d}")
else:
    st.info("No documents processed yet.")

# ----------------------------------------------------------
# Delete Document
# ----------------------------------------------------------
with st.expander("🗑️ Delete Document"):
    if all_docs:
        del_name = st.selectbox("Select Document", all_docs)

        if st.button("Delete"):
            vectorstore.delete_document(del_name)
            st.success(f"Deleted {del_name}")
            st.rerun()
    else:
        st.info("No documents to delete.")
