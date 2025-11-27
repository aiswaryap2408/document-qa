from typing import List
from bs4 import BeautifulSoup
import re
import numpy as np
from openai import OpenAI

# ------------------------------------------------------
# OpenAI Embedding Client
# ------------------------------------------------------
client = OpenAI()

def embed_text(text: str):
    """Return embedding using OpenAI Ada model"""
    try:
        emb = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return emb.data[0].embedding
    except Exception:
        # fallback for development
        return np.zeros(1536).tolist()


# ------------------------------------------------------
# Extract Hierarchy from Markdown (#, ##, ###, ####)
# ------------------------------------------------------
def extract_hierarchy_from_markdown(md_text: str):
    """
    Convert markdown into hierarchical records (h1-h4 + content)
    """
    records = []
    current = {"h1": None, "h2": None, "h3": None, "h4": None}

    for line in md_text.splitlines():
        line = line.strip()
        if not line:
            continue

        # detect # heading
        match = re.match(r'^(#{1,4})\s+(.*)', line)
        if match:
            level = len(match.group(1))
            title = match.group(2).strip()

            if level == 1:
                current["h1"], current["h2"], current["h3"], current["h4"] = title, None, None, None
            elif level == 2:
                current["h2"], current["h3"], current["h4"] = title, None, None
            elif level == 3:
                current["h3"], current["h4"] = title, None
            elif level == 4:
                current["h4"] = title

            continue

        # content under last heading
        records.append({
            "h1": current["h1"],
            "h2": current["h2"],
            "h3": current["h3"],
            "h4": current["h4"],
            "content": line
        })

    return records


# ------------------------------------------------------
# Extract Hierarchy from HTML (h1–h4 + paragraphs)
# ------------------------------------------------------
def extract_hierarchy_from_html(html: str):
    soup = BeautifulSoup(html, "html.parser")

    records = []
    current_h1 = current_h2 = current_h3 = current_h4 = None

    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "div", "ul"]):

        text = tag.get_text(strip=True)
        if not text:
            continue

        if tag.name == "h1":
            current_h1 = text
            current_h2 = current_h3 = current_h4 = None

        elif tag.name == "h2":
            current_h2 = text
            current_h3 = current_h4 = None

        elif tag.name == "h3":
            current_h3 = text
            current_h4 = None

        elif tag.name == "h4":
            current_h4 = text

        else:
            records.append({
                "h1": current_h1,
                "h2": current_h2,
                "h3": current_h3,
                "h4": current_h4,
                "content": text
            })

    return records


# ------------------------------------------------------
# Hierarchy Chunker (H4-H3-H2-H1 headings → large blocks)
# ------------------------------------------------------
def chunk_hierarchy_for_rag(records, chunk_size=1000, overlap=200):
    chunks = []

    # Build hierarchical heading
    def make_heading(r):
        parts = []
        if r["h4"]: parts.append(r["h4"])
        if r["h3"]: parts.append(r["h3"])
        if r["h2"]: parts.append(r["h2"])
        if r["h1"]: parts.append(r["h1"])
        return " - ".join(parts)

    # group content by hierarchical heading
    grouped = {}
    for r in records:
        heading = make_heading(r)
        grouped.setdefault(heading, [])
        grouped[heading].append(r["content"])

    # chunk each heading section
    for heading, contents in grouped.items():

        block = f"{heading}\n\n" + "\n".join(contents)

        start = 0
        L = len(block)

        while start < L:
            end = start + chunk_size
            chunk_text = block[start:end].strip()

            chunks.append({
                "heading": heading,
                "text": chunk_text
            })

            if end >= L:
                break

            start = end - overlap

    return chunks


# ------------------------------------------------------
# FINAL API: Extract + Chunk + Embed
# ------------------------------------------------------
def build_rag_chunks(doc_id: str, raw_html_or_md: str, is_html: bool):
    """
    This is the function your RAG processor will call.
    It returns PROPER RAG chunks:

        [
            {
                "doc_id": "file.txt",
                "heading": "H3 - H2 - H1",
                "text": "...",
                "embedding": [...]
            }
        ]
    """

    if is_html:
        records = extract_hierarchy_from_html(raw_html_or_md)
    else:
        records = extract_hierarchy_from_markdown(raw_html_or_md)

    hierarchical_chunks = chunk_hierarchy_for_rag(records)

    final_chunks = []

    for ch in hierarchical_chunks:
        final_chunks.append({
            "doc_id": doc_id,
            "heading": ch["heading"],
            "text": ch["text"],
            "embedding": embed_text(ch["text"])
        })

    return final_chunks
