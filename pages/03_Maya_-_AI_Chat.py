
import streamlit as st
import os
from dotenv import load_dotenv
from chat_handler import stream_simple_openai

# Ensure environment is loaded
load_dotenv(override=True)

st.set_page_config(page_title="Maya - AI Chat", layout="wide")

st.title(" Maya - AI Chat")

# -------------------------------------------------------------------
# Sidebar - Settings for Maya
# -------------------------------------------------------------------
st.sidebar.header("⚙️ Settings")

# API Key override
api_key = os.getenv("OPENAI_API_KEY")
user_api_key = st.sidebar.text_input("OpenAI API Key", type="password", help="Leave empty to use system default.")
if user_api_key:
    api_key = user_api_key

if not api_key:
    st.error("No API Key found. Please set OPENAI_API_KEY in .env or enter it in sidebar.")
    st.stop()

model = st.sidebar.selectbox("Model", ["gpt-4.1-mini", "gpt-4.1", "gpt-4"])

if st.sidebar.button("🧹 Clear Chat"):
    st.session_state["maya_history"] = []
    st.rerun()

# -------------------------------------------------------------------
# Load Maya Prompt
# -------------------------------------------------------------------
MAYA_PROMPT_FILE = "maya_prompt.txt"
if os.path.exists(MAYA_PROMPT_FILE):
    system_prompt = open(MAYA_PROMPT_FILE, "r", encoding="utf-8").read()
else:
    system_prompt = "You are Maya, a helpful AI assistant."

# -------------------------------------------------------------------
# Chat Interface
# -------------------------------------------------------------------
if "maya_history" not in st.session_state:
    st.session_state["maya_history"] = []

# Display History
for msg in st.session_state["maya_history"]:
    avatar = "🌙" if msg["role"] == "assistant" else "👤"
    with st.chat_message(msg["role"], avatar=avatar):
        st.write(msg["content"])

# Chat Input
user_input = st.chat_input("Chat with Maya...")

if user_input:
    # 1. User Message
    st.session_state["maya_history"].append({"role": "user", "content": user_input})
    with st.chat_message("user", avatar="👤"):
        st.write(user_input)

    # 2. Assistant Stream
    with st.chat_message("assistant", avatar="🌙"):
        message_placeholder = st.empty()
        full_response = ""
        
        try:
            stream = stream_simple_openai(
                system_prompt=system_prompt,
                conversation_history=st.session_state["maya_history"][:-1],
                question=user_input,
                model=model,
                api_key=api_key
            )
            
            for token in stream:
                full_response += token
                message_placeholder.markdown(full_response + "▌")
            
            message_placeholder.markdown(full_response)
            
        except Exception as e:
            st.error(f"Error: {e}")

    # 3. Save Assistant Message
    st.session_state["maya_history"].append({"role": "assistant", "content": full_response})
