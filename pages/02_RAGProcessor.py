import streamlit as st
import os
from chunking import extract_hierarchy, extract_hierarchy_from_markdown, chunk_hierarchy_for_rag
from vectorstore import InMemoryVectorStore
from rag_engine import RAGEngine
from openai import OpenAI


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

    st.success(f"Document `{doc_id}` processed and saved!")


# ----------------------------------------------------------
# List Processed Documents
# ----------------------------------------------------------
st.subheader("📚 Processed Documents")

if vectorstore.document_names:
    for d in vectorstore.document_names:
        st.write(f"• {d}")
else:
    st.info("No documents processed yet.")

# ----------------------------------------------------------
# Delete Document
# ----------------------------------------------------------
with st.expander("🗑️ Delete Document"):
    if vectorstore.document_names:
        del_name = st.selectbox("Select Document", vectorstore.document_names)

        if st.button("Delete"):
            vectorstore.delete_document(del_name)
            st.success(f"Deleted {del_name}")
            st.rerun()
    else:
        st.info("No documents to delete.")
