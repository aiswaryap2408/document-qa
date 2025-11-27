import streamlit as st
from dotenv import load_dotenv
import os
import time
import re

from vectorstore import InMemoryVectorStore
from rag_engine import RAGEngine
from chat_handler import stream_openai, stream_gemini


# ------------------------------------------------------------
# Typing Indicator Animation
# ------------------------------------------------------------
def typing_indicator(container):
    dots = ["⠁", "⠃", "⠇", "⠧", "⠷", "⠿", "⠷", "⠧", "⠇", "⠃"]
    i = 0
    while True:
        container.markdown(f" Assistant is thinking... {dots[i % len(dots)]}")
        time.sleep(0.12)
        i += 1
        yield


# ------------------------------------------------------------
# Grounding Percentage Calculator
# ------------------------------------------------------------
def compute_grounding_percent(answer: str, retrieved_chunks):
    if not retrieved_chunks:
        return 0.0, 100.0

    answer_words = re.findall(r"\w+", answer.lower())

    # CORRECT tuple-unpack
    context = " ".join([chunk["text"] for (chunk, score) in retrieved_chunks])
    context_words = set(re.findall(r"\w+", context.lower()))

    grounded = sum(1 for w in answer_words if w in context_words)
    total = len(answer_words)

    if total == 0:
        return 0.0, 100.0

    grounding = round((grounded / total) * 100, 2)
    hallucination = round(100 - grounding, 2)

    return grounding, hallucination


# ------------------------------------------------------------
# Load Environment Variables
# ------------------------------------------------------------
load_dotenv(".env")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ------------------------------------------------------------
# Streamlit Page Setup
# ------------------------------------------------------------
st.set_page_config(page_title="RAG Conversational Chatbot", layout="wide")
st.title("RAG Chatbot")


# ------------------------------------------------------------
# Session State Initialization
# ------------------------------------------------------------
if "vectorstore" not in st.session_state:
    st.session_state["vectorstore"] = InMemoryVectorStore()

if "chat_history" not in st.session_state:
    st.session_state["chat_history"] = []

vectorstore = st.session_state["vectorstore"]
engine = RAGEngine(vectorstore)


# ------------------------------------------------------------
# Sidebar Settings
# ------------------------------------------------------------
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

top_k = st.sidebar.slider("Top-K Chunks", 1, 10, 4)

# Document Selector
docs_available = vectorstore.document_names
selected_docs = st.sidebar.multiselect(
    "Select documents to use for RAG",
    docs_available,
    default=docs_available
)

if st.sidebar.button("🧹 Clear Chat"):
    st.session_state["chat_history"] = []
    st.rerun()


# ------------------------------------------------------------
# Load Astrology System Prompt
# ------------------------------------------------------------
PROMPT_FILE = "system_prompt.txt"

if os.path.exists(PROMPT_FILE):
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        system_prompt = f.read()
else:
    system_prompt = """
You are Astrology Guruji. 
Always speak with politeness and deep astrological knowledge.
If a question has supporting context from documents, use ONLY that.
If outside the document, answer using astrology expertise.
If the question is illogical (dowry, male pregnancy), politely decline.
"""


# ------------------------------------------------------------
# Chat Input
# ------------------------------------------------------------
st.subheader("💬 Ask Astrology Guruji")

user_input = st.chat_input("Ask your question...")

if user_input:

    # Add user message
    st.session_state["chat_history"].append({
        "role": "user",
        "content": user_input
    })

    # Retrieve RAG chunks
    retrieved_raw = engine.retrieve(user_input, top_k=top_k)

    # Filter by selected docs
    retrieved_filtered = [
        (chunk, score)
        for (chunk, score) in retrieved_raw
        if chunk["doc_id"] in selected_docs
    ]

    # ------------------------------------------------------------
    # Prepare clean chunk list for prompt feeding
    # ------------------------------------------------------------
    retrieved_clean = [
        {
            "text": chunk["text"],
            "heading": chunk["heading"],
            "doc_id": chunk["doc_id"],
            "score": score
        }
        for (chunk, score) in retrieved_filtered
    ]

    # ------------------------------------------------------------
    # Streaming Response
    # ------------------------------------------------------------
    with st.chat_message("assistant", avatar="🌙"):
        typing_placeholder = st.empty()
        streamed_out = st.empty()

        indicator = typing_indicator(typing_placeholder)
        next(indicator)

        full_response = ""

        try:
            # STREAM FROM MODEL
            if provider == "OpenAI":
                stream = stream_openai(
                    system_prompt,
                    retrieved_clean,
                    st.session_state["chat_history"][:-1],
                    user_input,
                    model=openai_model
                )
            else:
                stream = stream_gemini(
                    system_prompt,
                    retrieved_clean,
                    st.session_state["chat_history"][:-1],
                    user_input,
                    model=gemini_model
                )

            for token in stream:
                typing_placeholder.empty()
                full_response += token
                streamed_out.markdown(full_response)

        except Exception as e:
            typing_placeholder.empty()
            streamed_out.error(f"Error: {e}")

    # Compute grounding %
    grounding, hallucination = compute_grounding_percent(full_response, retrieved_filtered)

    # Store assistant message
    st.session_state["chat_history"].append({
        "role": "assistant",
        "content": full_response,
        "retrieved": retrieved_filtered,
        "grounding": grounding,
        "hallucination": hallucination
    })


# ------------------------------------------------------------
# Display Chat History
# ------------------------------------------------------------
st.subheader("🧾 Conversation")

for msg in st.session_state["chat_history"]:

    # USER
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.write(msg["content"])

    # ASSISTANT
    elif msg["role"] == "assistant":
        with st.chat_message("assistant", avatar="🌙"):
            st.write(msg["content"])

        if "grounding" in msg:
            st.info(
                f"**Grounding Accuracy:** {msg['grounding']}%  \n"
                f"**Model Contribution:** {msg['hallucination']}%"
            )

        # Correct tuple-unpacking for chunk viewer
        if msg.get("retrieved"):
            with st.expander("📌 RAG Context Used"):
                for (chunk, score) in msg["retrieved"]:
                    st.markdown(f"### {chunk['heading']}")
                    st.caption(f"Document: {chunk['doc_id']}  |  Score: {score:.4f}")
                    st.write(chunk["text"][:800] + ("..." if len(chunk['text']) > 800 else ""))
