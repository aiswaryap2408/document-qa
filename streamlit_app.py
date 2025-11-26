import streamlit as st
import os
from dotenv import load_dotenv
from openai import OpenAI
import google.generativeai as genai

st.set_page_config(page_title="Document QA", layout="centered")

# Load environment variables
load_dotenv(".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Load system prompt
PROMPT_FILE = "system_prompt.txt"
if os.path.exists(PROMPT_FILE):
    with open(PROMPT_FILE, "r") as f:
        SYSTEM_PROMPT = f.read()
else:
    SYSTEM_PROMPT = "You are a helpful assistant. Use ONLY the document to answer."

st.title("📘 Document Question Answering (OpenAI + Gemini)")
st.caption("API keys and system prompt loaded from .env and system_prompt.txt")

# -----------------------------
# MODEL SELECTION
# -----------------------------
provider = st.selectbox("Select Model Provider:", ["OpenAI", "Google Gemini"])

if provider == "OpenAI":
    model = st.selectbox("Select OpenAI Model", ["gpt-4.1-mini", "gpt-4.1", "gpt-5", "gpt-5.1"])
else:
    model = st.selectbox("Select Gemini Model", ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-pro"])

# -----------------------------
# FILE UPLOAD
# -----------------------------
uploaded_file = st.file_uploader("Upload .txt or .md file", type=["txt", "md"])

def read_file_chunks(file_obj, chunk_size=1024*1024*3):
    file_obj.seek(0)
    while True:
        chunk = file_obj.read(chunk_size)
        if not chunk:
            break
        yield chunk

document_text = ""
if uploaded_file:
    for chunk in read_file_chunks(uploaded_file):
        document_text += chunk.decode("utf-8", errors="ignore")

# -----------------------------
# QUESTION
# -----------------------------
question = st.text_input("Ask a question from the document")

# -----------------------------
# RUN QA
# -----------------------------
if st.button("Run Question Answering"):

    if not uploaded_file:
        st.error("Upload a document first.")
    elif not question.strip():
        st.error("Please enter a question.")
    else:
        st.info("Processing...")

        # -----------------------------
        # OPENAI
        # -----------------------------
        if provider == "OpenAI":
            if not OPENAI_API_KEY:
                st.error("OPENAI_API_KEY missing.")
            else:
                client = OpenAI(api_key=OPENAI_API_KEY)

                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Document:\n{document_text}"},
                    {"role": "user", "content": f"Question: {question}"}
                ]

                response = client.chat.completions.create(
                    model=model,
                    messages=messages
                )

                st.success("Answer:")
                st.write(response.choices[0].message.content)

        # -----------------------------
        # GEMINI
        # -----------------------------
        else:
            if not GEMINI_API_KEY:
                st.error("GEMINI_API_KEY missing.")
            else:
                model_ai = genai.GenerativeModel(model)

                prompt = f"""
SYSTEM INSTRUCTIONS:
{SYSTEM_PROMPT}

DOCUMENT:
{document_text}

QUESTION:
{question}
"""

                response = model_ai.generate_content(prompt)
                st.success("Answer:")
                st.write(response.text)

st.markdown("---")
st.caption("Custom system prompt loaded from system_prompt.txt.")
