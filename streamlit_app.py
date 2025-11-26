# streamlit_app.py
import streamlit as st
import os
from vectorstore import InMemoryVectorStore
from rag_engine import RAGEngine
from chat_handler import generate_with_openai, generate_with_gemini
from dotenv import load_dotenv

load_dotenv(".env")
st.set_page_config(page_title="RAG Chat", layout="wide")
st.title("🔎 RAG Chatbot")

# session init
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()
if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

# Load system prompt
PROMPT_FILE = "system_prompt.txt"
if os.path.exists(PROMPT_FILE):
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        system_prompt = f.read()
else:
    system_prompt = "You are a helpful assistant. Use ONLY the document to answer. If not found, say 'Not found in document.'"

# sidebar controls
provider = st.sidebar.selectbox("Provider", ["OpenAI", "Google Gemini"])
openai_model = st.sidebar.selectbox("OpenAI model", ["gpt-4.1-mini","gpt-4.1","gpt-5","gpt-5.1"])
gemini_model = st.sidebar.selectbox("Gemini model", ["gemini-1.5-flash","gemini-1.5-pro","gemini-2.0-flash","gemini-2.0-pro"])
top_k = st.sidebar.number_input("Top-K", 1, 10, 4)

engine = RAGEngine(st.session_state["vectorstore"])

st.subheader("Ask a question")
query = st.text_input("Your question here")
if st.button("Ask"):
    if not query.strip():
        st.warning("Type a question")
    else:
        # retrieve
        retrieved = engine.retrieve(query, top_k=top_k)
        # store user message with retrieved
        st.session_state["chat_history"].append({"role":"user","content":query,"retrieved":retrieved})
        # generate
        try:
            if provider == "OpenAI":
                answer = generate_with_openai(system_prompt, retrieved, query, model=openai_model)
            else:
                answer = generate_with_gemini(system_prompt, retrieved, query, model=gemini_model)
            st.session_state["chat_history"].append({"role":"assistant","content":answer})
        except Exception as e:
            st.error(f"Generation error: {e}")

# display chat
st.markdown("## Conversation")
# Show the most recent answer only
if st.session_state["chat_history"]:
    last_msg = st.session_state["chat_history"][-1]   # last assistant message
    last_user = st.session_state["chat_history"][-2]  # last user message

    st.subheader("🧑‍💻 Your Question")
    st.write(last_user["content"])

    st.subheader("🤖 Assistant Answer")
    st.write(last_msg["content"])

    # Show retrieved chunks
    if last_user.get("retrieved"):
        st.subheader("📌 Retrieved Chunks (Context Used)")
        for i, r in enumerate(last_user["retrieved"], start=1):
            st.markdown(f"### {i}. {r.get('heading', '(no heading)')}")
            st.caption(f"Source: {r.get('source')} | Score: {r['score']:.4f}")
            st.write(r["text"][:600] + ("..." if len(r["text"]) > 600 else ""))

   