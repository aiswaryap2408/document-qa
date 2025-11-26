import streamlit as st
import os

st.set_page_config(page_title="System Prompt Editor", layout="centered")
st.title("⚙️ System Prompt Configuration")

PROMPT_FILE = "system_prompt.txt"

# Create default file if missing
if not os.path.exists(PROMPT_FILE):
    with open(PROMPT_FILE, "w") as f:
        f.write("You are a helpful assistant. Use ONLY the document to answer. If uncertain, say 'Not found in document.'")

# Load current prompt
with open(PROMPT_FILE, "r") as f:
    current_prompt = f.read()

st.subheader("Edit System Prompt")
new_prompt = st.text_area("System Prompt:", value=current_prompt, height=250)

if st.button("Save System Prompt"):
    with open(PROMPT_FILE, "w") as f:
        f.write(new_prompt)

    st.success("System prompt saved successfully!")
    st.balloons()

st.markdown("---")
st.caption("This system prompt will be used in the Document QA page.")
