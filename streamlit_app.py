import streamlit as st
from dotenv import load_dotenv
import os
import time
import re

from vectorstore import InMemoryVectorStore
from rag_engine import RAGEngine
from chat_handler import stream_openai, stream_gemini


# -------------------------------------------------------------------
# Typing Indicator
# -------------------------------------------------------------------
def typing_indicator(container):
    dots = ["⠁", "⠃", "⠇", "⠧", "⠷", "⠿", "⠷", "⠧"]
    i = 0
    while True:
        container.markdown(f"🧘 Guruji is thinking... {dots[i % len(dots)]}")
        time.sleep(0.12)
        i += 1
        yield


# -------------------------------------------------------------------
# Grounding Calculation
# -------------------------------------------------------------------
def compute_grounding_percent(answer: str, retrieved_chunks):
    if not retrieved_chunks:
        return 0.0, 100.0

    answer_words = re.findall(r"\w+", answer.lower())
    context = " ".join([chunk["text"] for (chunk, score) in retrieved_chunks])
    context_words = set(re.findall(r"\w+", context.lower()))

    grounded = sum(1 for w in answer_words if w in context_words)
    total = len(answer_words)

    if total == 0:
        return 0.0, 100.0

    grounding = round((grounded / total) * 100, 2)
    hallucination = round(100 - grounding, 2)
    return grounding, hallucination


# -------------------------------------------------------------------
# Load Keys (Secret-friendly)
# -------------------------------------------------------------------
load_dotenv(".env")


# Fallback to .env
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

try:
    if "OPENAI_API_KEY" in st.secrets:
        OPENAI_API_KEY = st.secrets["OPENAI_API_KEY"]
    if "GEMINI_API_KEY" in st.secrets:
        GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
except Exception:
    pass  # Avoid StreamlitSecretNotFoundError locally


# -------------------------------------------------------------------
# Streamlit Config
# -------------------------------------------------------------------
st.set_page_config(page_title="RAG Guruji Chatbot", layout="wide")
st.title("RAG Chatbot")


# -------------------------------------------------------------------
# Initialize Session State
# -------------------------------------------------------------------
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()

if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

vectorstore = st.session_state["vectorstore"]
engine = RAGEngine(vectorstore)


# -------------------------------------------------------------------
# Sidebar Configuration
# -------------------------------------------------------------------
st.sidebar.header("⚙️ Settings")

provider = st.sidebar.selectbox("Model Provider", ["OpenAI", "Google Gemini"])

openai_model = st.sidebar.selectbox(
    "OpenAI Model",
    ["gpt-4.1-mini", "gpt-4.1", "gpt-5", "gpt-5.1"]
)

gemini_model = st.sidebar.selectbox(
    "Gemini Model",
    ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.0-pro"]
)

top_k = st.sidebar.slider("Top-K Chunks", 1, 10, 4)


# List and filter documents
st.sidebar.subheader("📚 RAG Documents")
docs_available = vectorstore.document_names
selected_docs = st.sidebar.multiselect(
    "Use these documents:",
    docs_available,
    default=docs_available
)

if st.sidebar.button("🧹 Clear Chat"):
    st.session_state["chat_history"] = []
    st.rerun()


# -------------------------------------------------------------------
# System Prompt
# -------------------------------------------------------------------
PROMPT_FILE = "system_prompt.txt"
if os.path.exists(PROMPT_FILE):
    system_prompt = open(PROMPT_FILE, "r", encoding="utf-8").read()
else:
    system_prompt = """
You are Astrology Guruji.
You always speak politely and give deep astrological insights.
If a question matches document context, use ONLY that.
If outside documents, answer using astrology (dashas, planets, life stages).
If the question is logically invalid (dowry, male pregnancy), decline respectfully.
"""


# -------------------------------------------------------------------
# Chat Input
# -------------------------------------------------------------------
st.subheader("💬 Ask Your Question")

user_input = st.chat_input("Type your question...")

if user_input:

    st.session_state["chat_history"].append({
        "role": "user",
        "content": user_input
    })

    # Retrieve RAG chunks
    raw_chunks = engine.retrieve(user_input, top_k=top_k)

    # Filter selected documents
    filtered_chunks = [
        (chunk, score)
        for (chunk, score) in raw_chunks
        if chunk["doc_id"] in selected_docs
    ]

    # Clean chunks for feeding to model
    clean_chunks = [
        {
            "text": chunk["text"],
            "heading": chunk["heading"],
            "doc_id": chunk["doc_id"],
            "score": score
        }
        for (chunk, score) in filtered_chunks
    ]

    # Stream response
    with st.chat_message("assistant", avatar="🌙"):
        typing_area = st.empty()
        output_area = st.empty()

        indicator = typing_indicator(typing_area)
        next(indicator)

        full_response = ""

        try:
            if provider == "OpenAI":
                stream = stream_openai(
                    system_prompt,
                    clean_chunks,
                    st.session_state["chat_history"][:-1],
                    user_input,
                    model=openai_model
                )
            else:
                stream = stream_gemini(
                    system_prompt,
                    clean_chunks,
                    st.session_state["chat_history"][:-1],
                    user_input,
                    model=gemini_model
                )

            for token in stream:
                typing_area.empty()
                full_response += token
                output_area.markdown(full_response)

        except Exception as e:
            typing_area.empty()
            output_area.error(f"Error: {e}")

    # Grounding
    grounding, hallucination = compute_grounding_percent(full_response, filtered_chunks)

    # Save assistant response
    st.session_state["chat_history"].append({
        "role": "assistant",
        "content": full_response,
        "retrieved": filtered_chunks,
        "grounding": grounding,
        "hallucination": hallucination
    })


# -------------------------------------------------------------------
# Display Chat History
# -------------------------------------------------------------------
st.subheader("📜 Conversation")

for msg in st.session_state["chat_history"]:

    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.write(msg["content"])

    else:
        with st.chat_message("assistant", avatar="🌙"):
            st.write(msg["content"])

        st.info(
            f"Grounding: **{msg.get('grounding', 0)}%** | "
            f"Model Contribution: **{msg.get('hallucination', 100)}%**"
        )

        if msg.get("retrieved"):
            with st.expander("📌 RAG Context"):
                for (chunk, score) in msg["retrieved"]:
                    st.markdown(f"### {chunk['heading']}")
                    st.caption(f"{chunk['doc_id']} | Score: {score:.4f}")
                    st.write(chunk["text"])


