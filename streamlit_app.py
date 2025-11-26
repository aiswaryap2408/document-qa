import streamlit as st
from dotenv import load_dotenv
import os

from vectorstore import InMemoryVectorStore
from rag_engine import RAGEngine
from chat_handler import (
    stream_openai,
    stream_gemini,
)

# Load environment variables
load_dotenv(".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# -----------------------------------------------------
# Streamlit Config
# -----------------------------------------------------
st.set_page_config(page_title="RAG Conversational Chatbot", layout="wide")
st.title("🤖 RAG Conversational Chatbot")


# -----------------------------------------------------
# Session State Initialization
# -----------------------------------------------------
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()

if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []


# -----------------------------------------------------
# Load System Prompt
# -----------------------------------------------------
PROMPT_FILE = "system_prompt.txt"

if os.path.exists(PROMPT_FILE):
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        system_prompt = f.read()
else:
    system_prompt = (
        "You are a helpful assistant. Answer using ONLY the provided context. "
        "If information is missing, respond: 'Not found in document.'"
    )


# -----------------------------------------------------
# Sidebar Settings
# -----------------------------------------------------
st.sidebar.header("⚙️ Settings")

provider = st.sidebar.selectbox("LLM Provider", ["OpenAI", "Google Gemini"])

openai_model = st.sidebar.selectbox(
    "OpenAI Model",
    ["gpt-4.1-mini", "gpt-4.1", "gpt-5", "gpt-5.1"]
)

gemini_model = st.sidebar.selectbox(
    "Gemini Model",
    ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-pro"]
)

top_k = st.sidebar.number_input("Top-K Chunks", min_value=1, max_value=10, value=4)

if st.sidebar.button("🗑️ Clear Chat"):
    st.session_state["chat_history"] = []
    st.rerun()


# -----------------------------------------------------
# Instantiate RAG Engine
# -----------------------------------------------------
engine = RAGEngine(st.session_state["vectorstore"])


# -----------------------------------------------------
# Chat Input (Conversational with Streaming)
# -----------------------------------------------------
st.subheader("💬 Ask a question from your indexed documents")

user_input = st.chat_input("Type your message and press Enter...")

if user_input:
    # Save user message
    st.session_state["chat_history"].append({
        "role": "user",
        "content": user_input
    })

    # Retrieve RAG context
    retrieved_chunks = engine.retrieve(user_input, top_k=top_k)

    # History WITHOUT the latest message
    conversation_history = st.session_state["chat_history"][:-1]

    # Placeholder to render assistant streaming
    with st.chat_message("assistant"):
        streamed_output = st.empty()
        full_response = ""

        try:
            # Select streaming generator
            if provider == "OpenAI":
                stream = stream_openai(
                    system_prompt,
                    retrieved_chunks,
                    conversation_history,
                    user_input,
                    model=openai_model
                )
            else:
                stream = stream_gemini(
                    system_prompt,
                    retrieved_chunks,
                    conversation_history,
                    user_input,
                    model=gemini_model
                )

            # Consume streaming chunks
            for token in stream:
                full_response += token
                streamed_output.markdown(full_response)

        except Exception as e:
            streamed_output.error(f"Error: {e}")

    # Save assistant final message
    st.session_state["chat_history"].append({
        "role": "assistant",
        "content": full_response,
        "retrieved": retrieved_chunks
    })


# -----------------------------------------------------
# Display Chat History
# -----------------------------------------------------
st.subheader("🧵 Conversation")

for msg in st.session_state["chat_history"]:

    # USER MESSAGE
    if msg["role"] == "user":
        with st.chat_message("user"):
            st.write(msg["content"])

    # ASSISTANT MESSAGE
    elif msg["role"] == "assistant":
        with st.chat_message("assistant"):
            st.write(msg["content"])

        # Show RAG Chunks Used
        if msg.get("retrieved"):
            with st.expander("📌 Retrieved Chunks (RAG Context Used)"):
                for i, r in enumerate(msg["retrieved"], start=1):
                    st.markdown(f"### {i}. {r.get('heading', '(No Heading)')}")
                    st.caption(f"Score: {r['score']:.4f} | Source: {r['source']}")
                    st.write(r["text"][:600] + ("..." if len(r["text"]) > 600 else ""))
