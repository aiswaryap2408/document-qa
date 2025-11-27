import streamlit as st
import fitz  # PyMuPDF
from vectorstore import InMemoryVectorStore
from chunking import (
    extract_hierarchy_from_html,
    extract_hierarchy_from_markdown,
    build_rag_chunks
)

st.set_page_config(page_title="RAG Document Processor", layout="wide")
st.title("📄 RAG Document Processor")

# -----------------------------------------------------
# Initialize Vectorstore
# -----------------------------------------------------
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()

vectorstore = st.session_state["vectorstore"]

# -----------------------------------------------------
# List Currently Vectorized Documents
# -----------------------------------------------------
# -----------------------------------------------------
# DOCUMENTS ALREADY PROCESSED (Auto-refresh)
# -----------------------------------------------------
st.subheader("📘 Documents Already Processed")

doc_list = vectorstore.document_names

if not doc_list:
    st.info("No documents processed yet.")
else:
    st.success(f"{len(doc_list)} document(s) available:")
    st.write(doc_list)

st.markdown("---")

# -----------------------------------------------------
# Upload Section
# -----------------------------------------------------
st.subheader("📤 Upload Document for RAG Processing")

file = st.file_uploader(
    "Upload .txt, .md, .html, or .pdf",
    type=["txt", "md", "html", "pdf"]
)

if file:
    doc_id = file.name
    st.write(f"Processing **{doc_id}** ...")

    raw_text = ""
    is_html = False

    # -----------------------------------------------------
    # FILE TYPE: TXT
    # -----------------------------------------------------
    if file.type == "text/plain":
        raw_text = file.read().decode("utf-8")
        structured = extract_hierarchy_from_markdown(raw_text)
        is_html = False

    # -----------------------------------------------------
    # FILE TYPE: MD
    # -----------------------------------------------------
    elif file.type == "text/markdown":
        raw_text = file.read().decode("utf-8")
        structured = extract_hierarchy_from_markdown(raw_text)
        is_html = False

    # -----------------------------------------------------
    # FILE TYPE: HTML
    # -----------------------------------------------------
    elif file.type == "text/html":
        raw_html = file.read().decode("utf-8")
        structured = extract_hierarchy_from_html(raw_html)
        is_html = True

    # -----------------------------------------------------
    # FILE TYPE: PDF
    # -----------------------------------------------------
    elif file.type == "application/pdf":
        pdf_bytes = file.read()
        pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in pdf:
            text += page.get_text()
        raw_text = text
        structured = extract_hierarchy_from_markdown(raw_text)  # PDF → text → markdown parsing
        is_html = False

    else:
        st.error("Unsupported file type")
        st.stop()

    st.success("✔ Document parsed successfully.")

    # -----------------------------------------------------
    # Build final RAG chunks (heading + text + embedding)
    # -----------------------------------------------------
    rag_chunks = build_rag_chunks(
        doc_id=doc_id,
        raw_html_or_md=raw_text if not is_html else file.read(),
        is_html=is_html
    )

    # -----------------------------------------------------
    # Save document to vectorstore
    # -----------------------------------------------------
    st.session_state["vectorstore"].add_document(doc_id, rag_chunks)

    st.success(f"🎉 Document '{doc_id}' has been vectorized and added to the store!")
    st.snow()
    st.rerun()

# -----------------------------------------------------
# DELETE DOCUMENT (Auto-refresh)
# -----------------------------------------------------
st.subheader("🗑️ Delete a Document")

if doc_list:
    doc_to_delete = st.selectbox("Select document to delete", doc_list, key="delete_doc")

    if st.button("Delete Selected Document"):
        vectorstore.delete_document(doc_to_delete)
        st.success(f"Document '{doc_to_delete}' deleted successfully!")
        st.rerun()  # 🔥 auto-refresh page
else:
    st.info("No documents to delete.")

    