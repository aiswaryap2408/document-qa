# pages/01_SystemPrompt.py
import streamlit as st
import os

st.set_page_config(page_title="System Prompt Editor")
st.title("⚙️ System Prompt Editor")

PROMPT_FILE = "system_prompt.txt"
if not os.path.exists(PROMPT_FILE):
    with open(PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write("You are a helpful assistant. Use ONLY the document to answer. If not found, say 'Not found in document.'")

with open(PROMPT_FILE, "r", encoding="utf-8") as f:
    current = f.read()

new = st.text_area("Edit system prompt", value=current, height=300)

if st.button("Save prompt"):
    with open(PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write(new)
    st.success("Saved system prompt.")
