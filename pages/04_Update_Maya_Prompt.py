
import streamlit as st
import os

st.set_page_config(page_title="Update Maya Prompt", layout="wide")

st.title("⚙️ Update Maya Prompt")

MAYA_PROMPT_FILE = "maya_prompt.txt"

# Ensure file exists
if not os.path.exists(MAYA_PROMPT_FILE):
    with open(MAYA_PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write("You are Maya, a helpful AI assistant.")

# Read current prompt
with open(MAYA_PROMPT_FILE, "r", encoding="utf-8") as f:
    current_prompt = f.read()

st.info("Edit the specific personality and instructions for the Maya AI.")

new_prompt = st.text_area("System Prompt", value=current_prompt, height=400)

if st.button("💾 Save Changes"):
    with open(MAYA_PROMPT_FILE, "w", encoding="utf-8") as f:
        f.write(new_prompt)
    st.success("Maya's prompt has been updated!")
    st.rerun()
