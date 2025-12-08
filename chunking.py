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

    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "div", "ul", "table"]):
        if tag.name == "table":
            # Preserve the full HTML of the table so the LLM can see the structure
            text = str(tag)
        else:
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
    chunk_size: int = 1500,  # Increased default slightly to accommodate full tables
    overlap: int = 300
):
    """
    Converts hierarchical records (h1-h4 + content) into chunked blocks.
    Uses line-aware splitting to preserve table rows and list items.
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

    for heading, contents in grouped.items():
        
        # Simple Line-Aware Chunking (User requested removal of Atomic Logic)
        current_chunk_lines = []
        current_chunk_size = len(heading) + 2

        # Flatten all content blocks into lines
        all_lines = []
        for content_block in contents:
            all_lines.extend(content_block.splitlines())

        for line in all_lines:
            line_len = len(line) + 1
            
            # If adding this line exceeds chunk size, start a new chunk
            # Note: If a single line is massive (> chunk_size), it will create an oversized chunk.
            # But we rely on token budgeting in retrieval to handle context size.
            if (current_chunk_size + line_len > chunk_size) and current_chunk_lines:
                chunk_text = f"{heading}\n\n" + "\n".join(current_chunk_lines)
                chunks.append({"heading": heading, "text": chunk_text})
                
                # Simple overlap could be added here, but for now we reset cleanly 
                # to avoid complexity as per user request.
                current_chunk_lines = []
                current_chunk_size = len(heading) + 2
            
            current_chunk_lines.append(line)
            current_chunk_size += line_len
            
        # Final flush
        if current_chunk_lines:
            chunk_text = f"{heading}\n\n" + "\n".join(current_chunk_lines)
            chunks.append({"heading": heading, "text": chunk_text})

    return chunks
