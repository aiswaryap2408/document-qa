from typing import List, Dict, Any
from bs4 import BeautifulSoup
import re

# ============================================================
# MARKDOWN HIERARCHY PARSER
# ============================================================
def extract_hierarchy_from_markdown(md_text: str):
    """
    Convert markdown (#, ##, ###, ####) into hierarchical records.
    """
    records = []

    current = {"h1": None, "h2": None, "h3": None, "h4": None}

    for line in md_text.splitlines():
        line = line.strip()
        if not line:
            continue

        match = re.match(r"^(#{1,4})\s+(.*)", line)
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

        # Normal content under headings
        records.append({
            "h1": current["h1"],
            "h2": current["h2"],
            "h3": current["h3"],
            "h4": current["h4"],
            "content": line
        })

    return records


# ============================================================
# HTML HIERARCHY PARSER
# ============================================================
def extract_hierarchy(html: str):
    """
    Extract h1 → h2 → h3 → h4 → content structure from HTML or text.
    """
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


# ============================================================
# HIERARCHICAL CHUNKING
# ============================================================
def chunk_hierarchy_for_rag(
    records: List[Dict[str, Any]],
    chunk_size: int = 1000,
    overlap: int = 200
):
    """
    Converts hierarchical records (h1-h4 + content) into chunked blocks.
    """

    chunks = []

    # Build hierarchical heading string
    def make_heading(r):
        parts = []
        if r["h4"]: parts.append(r["h4"])
        if r["h3"]: parts.append(r["h3"])
        if r["h2"]: parts.append(r["h2"])
        if r["h1"]: parts.append(r["h1"])
        return " - ".join(parts)

    # Group content by heading
    grouped = {}

    for r in records:
        key = make_heading(r)

        if key:
            grouped.setdefault(key, [])
            grouped[key].append(r["content"])

    # Chunk each section
    for heading, contents in grouped.items():

        full_text = f"{heading}\n\n" + "\n".join(contents)
        L = len(full_text)
        start = 0

        while start < L:
            end = start + chunk_size
            chunk_text = full_text[start:end].strip()

            chunks.append({
                "heading": heading,
                "text": chunk_text
            })

            if end >= L:
                break

            start = end - overlap

    return chunks
