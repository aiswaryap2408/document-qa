import streamlit as st
import os
import hashlib

from chunking import (
    chunk_text,
    extract_hierarchy,
    extract_hierarchy_from_markdown,
    chunk_hierarchy_for_rag
)

from rag_engine import RAGEngine
from vectorstore import InMemoryVectorStore


# ------------------------------------------------
# PAGE SETUP
# ------------------------------------------------
st.set_page_config(page_title="RAG Processor", layout="wide")
st.title("📄 RAG Processor — Upload → Chunk → Embed")

# ------------------------------------------------
# SESSION STATE INIT
# ------------------------------------------------
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()

if "cached_docs" not in st.session_state:
    st.session_state["cached_docs"] = set()


# ------------------------------------------------
# HELPER — Detect HTML inside file content
# ------------------------------------------------
def is_html_content(text: str) -> bool:
    html_indicators = [
        "<html", "<body", "<head",
        "<h1", "<h2", "<h3", "<h4",
        "<div", "<span", "<p"
    ]
    lower = text.lower()
    return any(tag in lower for tag in html_indicators)


# ------------------------------------------------
# FILE UPLOAD
# ------------------------------------------------
uploaded = st.file_uploader(
    "Upload .txt, .md, .html, .htm",
    type=["txt", "md", "html", "htm"]
)

chunk_size = st.number_input("Chunk size", min_value=300, max_value=5000, value=1200)
overlap = st.number_input("Overlap", min_value=0, max_value=2000, value=200)

if uploaded:
    text = uploaded.read().decode("utf-8", errors="ignore")

    st.subheader("📘 Document Preview")
    st.text_area("Preview (first 2000 chars)", text[:2000], height=200)

    # Unique doc ID
    doc_id = hashlib.sha1((uploaded.name + str(len(text))).encode()).hexdigest()

    # ------------------------------------------------
    # PROCESSING BUTTON
    # ------------------------------------------------
    if st.button("Chunk & Embed Document"):

        filename = uploaded.name.lower()
        rag_chunks = None

        # ------------------------------------------------
        # CASE 1: HTML FILE (.html or .htm)
        # ------------------------------------------------
        if filename.endswith((".html", ".htm")):
            st.info("HTML detected → Using hierarchical chunking (H1 → H4).")

            records = extract_hierarchy(text)
            rag_chunks = chunk_hierarchy_for_rag(records, chunk_size, overlap)

        # ------------------------------------------------
        # CASE 2: MD FILE, use markdown heading extraction
        # ------------------------------------------------
        elif filename.endswith(".md"):
            st.info("Markdown detected → Parsing #, ##, ###, #### as headings.")

            records = extract_hierarchy_from_markdown(text)
            rag_chunks = chunk_hierarchy_for_rag(records, chunk_size, overlap)

        # ------------------------------------------------
        # CASE 3: TXT FILE but contains HTML → treat as HTML
        # ------------------------------------------------
        elif is_html_content(text):
            st.info(".txt file contains HTML → Using hierarchical chunking.")

            records = extract_hierarchy(text)
            rag_chunks = chunk_hierarchy_for_rag(records, chunk_size, overlap)

        # ------------------------------------------------
        # CASE 4: Plain text → simple chunking
        # ------------------------------------------------
        else:
            st.info("Plain text detected → Using simple chunking.")

            simple_chunks = chunk_text(text, chunk_size, overlap)

            rag_chunks = [
                {
                    "heading": uploaded.name,
                    "text": chunk
                }
                for chunk in simple_chunks
            ]

        # ------------------------------------------------
        # Build final chunk list
        # ------------------------------------------------
        chunks = [c["text"] for c in rag_chunks]

        metadatas = [
            {
                "doc_id": doc_id,
                "heading": c["heading"] or uploaded.name,
                "chunk_index": idx,
                "text": c["text"],
                "source": uploaded.name
            }
            for idx, c in enumerate(rag_chunks)
        ]

        # ------------------------------------------------
        # Embed into vector store
        # ------------------------------------------------
        engine = RAGEngine(st.session_state["vectorstore"])
        engine.embed_and_add(chunks, metadatas)

        st.session_state["cached_docs"].add(doc_id)

        st.success(f"Embedded {len(chunks)} chunks into the RAG vector store.")
        st.balloons()

        # ------------------------------------------------
        # Display summary
        # ------------------------------------------------
        st.subheader("📦 Chunk Summary (First 10)")
        for i, meta in enumerate(metadatas[:10]):
            st.markdown(f"### Chunk {i}")
            st.write(f"**Heading:** {meta['heading']}")
            preview = meta["text"][:300] + ("..." if len(meta["text"]) > 300 else "")
            st.caption(preview)

        if len(metadatas) > 10:
            st.info(f"Showing first 10 of {len(metadatas)} total chunks.")
