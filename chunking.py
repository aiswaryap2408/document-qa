from typing import List
from bs4 import BeautifulSoup
import re

# -------------------------------------
# SIMPLE CHUNKER
# -------------------------------------

def extract_hierarchy_from_markdown(md_text: str):
    """
    Convert markdown (#, ##, ###, ####) into hierarchical records similar to extract_hierarchy().
    Produces records with h1/h2/h3/h4 and content fields.
    """
    records = []
    current = {"h1": None, "h2": None, "h3": None, "h4": None}

    for line in md_text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Match markdown heading: #, ##, ###, ####
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

        # Normal content under the last heading
        records.append({
            "h1": current["h1"],
            "h2": current["h2"],
            "h3": current["h3"],
            "h4": current["h4"],
            "content": line
        })

    return records

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    if chunk_size <= overlap:
        raise ValueError("chunk_size must be larger than overlap")

    chunks = []
    start = 0
    L = len(text)

    while start < L:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())

        if end >= L:
            break

        start = end - overlap

    return [c for c in chunks if c]


# ================================================================
# Extract H1 / H2 / H3 / H4 structure
# ================================================================
def extract_hierarchy(html: str):
    soup = BeautifulSoup(html, "html.parser")

    records = []
    current_h1 = current_h2 = current_h3 = current_h4 = None

    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "div", "ul"]):

        text = tag.get_text(strip=True)

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
            if text:
                records.append({
                    "h1": current_h1,
                    "h2": current_h2,
                    "h3": current_h3,
                    "h4": current_h4,
                    "content": text
                })

    return records


# ================================================================
# Hierarchy Chunker (H4-H3-H2-H1 headings)
# ================================================================
def chunk_hierarchy_for_rag(
        records,
        chunk_size=1000,
        overlap=200
    ):
    chunks = []

    # Build hierarchical heading
    def make_heading(r):
        parts = []
        if r["h4"]: parts.append(r["h4"])
        if r["h3"]: parts.append(r["h3"])
        if r["h2"]: parts.append(r["h2"])
        if r["h1"]: parts.append(r["h1"])
        return " - ".join(parts)

    # Group by heading
    grouped = {}
    for r in records:
        key = make_heading(r)
        grouped.setdefault(key, [])
        grouped[key].append(r["content"])

    # Chunk each section
    for heading, contents in grouped.items():

        block = f"{heading}\n\n" + "\n".join(contents)

        start = 0
        L = len(block)

        while start < L:
            end = start + chunk_size

            chunk_text_block = block[start:end].strip()
            chunks.append({
                "heading": heading,
                "text": chunk_text_block
            })

            if end >= L:
                break

            start = end - overlap

    return chunks
