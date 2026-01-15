# chat_handler.py
import os
import requests
import json
from openai import OpenAI
import google.generativeai as genai
import re
from typing import List, Dict, Any


def convert_markdown_to_html(text: str) -> str:
    """
    Returns the text as is.
    User requested to NOT re-enable formatting logic.
    """
    if not isinstance(text, str):
        return text
    return text.strip()

def apply_token_budget(chunks, max_chars=100000):
    """
    Returns a subset of chunks that fits within the max_chars budget.
    100,000 chars is approx 25k tokens. 
    """
    if not chunks:
        return []

    current_chars = 0
    selected_chunks = []
    
    for chunk in chunks:
        # Crude estimate: 
        text_len = len(chunk['text']) + len(chunk['heading']) + 50 # overhead
        
        # If the first chunk itself is larger than max_chars, still include it 
        # (GPT-4o can handle up to 128k tokens, so a single 30k char chunk is fine)
        if not selected_chunks or (current_chars + text_len <= max_chars):
            selected_chunks.append(chunk)
            current_chars += text_len
        else:
            break
            
    return selected_chunks

def get_openai_client(api_key: str = None):
    if api_key is None:
        api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)

def generate_with_openai(system_prompt, context_chunks, conversation_history, question,
                         model="gpt-4o-mini", api_key=None, json_mode=False):

    client = get_openai_client(api_key)

    # Build context text (apply budget)
    budgeted_chunks = apply_token_budget(context_chunks)
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(budgeted_chunks)])
    print(f"DEBUG [ChatHandler]: Sending context with {len(context)} chars ({len(budgeted_chunks)} chunks).")

    # Build conversation messages
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": (
            "You are in a live astrology consultation. "
            "1. Use the provided context for all factual predictions and planetary details. "
            "2. If a user provides a short response (like 'yes', 'ok', 'go on') to your previous question, "
            "be conversational and proceed with the relevant details from the context. "
            "3. If the answer is truly missing from the context and history, say 'Not found in document.' "
            "4. Review the conversation history and avoid repeating information already shared."
        )}
    ]
    # Note: Structure/formatting is controlled by the main system_prompt.

    # Append conversation history
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add new question with context
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nUser Question: {question}"
    })

    # Ask model
    kwargs = {
        "model": model,
        "messages": messages
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)

    ans = resp.choices[0].message.content
    return convert_markdown_to_html(ans)

def generate_with_gemini(system_prompt, context_chunks, conversation_history, question,
                         model="gemini-1.5-pro", api_key=None):

    gem_api_key = api_key or os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=gem_api_key)

    budgeted_chunks = apply_token_budget(context_chunks)
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(budgeted_chunks)])

    # Build conversation transcript
    chat_history = ""
    for msg in conversation_history:
        role = "User" if msg["role"] == "user" else "Assistant"
        chat_history += f"{role}: {msg['content']}\n"

    prompt = f"""
        SYSTEM:
        {system_prompt}

        CONVERSATION:
        {chat_history}

        CONTEXT:
        {context}

        QUESTION:
        {question}

        Answer naturally as part of the conversation.
        Use ONLY the context. If answer not found, say 'Not found in document.'
        """

    model_ai = genai.GenerativeModel(model)
    res = model_ai.generate_content(prompt)
    ans = getattr(res, "text", str(res))
    return convert_markdown_to_html(ans)

def stream_openai(system_prompt, context_chunks, conversation_history, question,
                  model="gpt-4o-mini", api_key=None):

    client = get_openai_client(api_key)

    # Apply Token Budget logic
    context_chunks = apply_token_budget(context_chunks)

    # Build context text
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(context_chunks)])

    # Messages list
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": "Use ONLY the retrieved context to answer. If missing, say 'Not found in document.'"}
    ]

    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nUser Question: {question}"
    })

    # STREAM response
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True
    )

    # --- FIX: delta.content is attribute, not dict ---
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta:
            delta = chunk.choices[0].delta
            if hasattr(delta, "content") and delta.content:
                yield convert_markdown_to_html(delta.content)



def stream_gemini(system_prompt, context_chunks, conversation_history, question,
                  model="gemini-1.5-pro", api_key=None):

    gem_api_key = api_key or os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=gem_api_key)

    # Apply Token Budget logic
    context_chunks = apply_token_budget(context_chunks)

    # Build context text
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(context_chunks)])

    # Build conversation transcript
    history_text = ""
    for msg in conversation_history:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    prompt = f"""
        SYSTEM:
        {system_prompt}

        CONVERSATION:
        {history_text}

        CONTEXT:
        {context}

        QUESTION:
        {question}

        Answer using ONLY context. If missing, say 'Not found in document.'
        """

    model_ai = genai.GenerativeModel(model)

    # STREAM
    stream = model_ai.generate_content(prompt, stream=True)

    for event in stream:
        if hasattr(event, "text"):
            yield convert_markdown_to_html(event.text)

def build_gemini_prompt(system_prompt, chunks, history, question):
    context = "\n\n".join(
        [f"[chunk {i+1}] {c['text']}" for i, c in enumerate(chunks)]
    )

    conv = ""
    for msg in history:
        role = "User" if msg["role"] == "user" else "Assistant"
        conv += f"{role}: {msg['content']}\n"

    prompt = f"""
        SYSTEM:
        {system_prompt}

        CONVERSATION:
        {conv}

        CONTEXT:
        {context}

        QUESTION:
        {question}

        Answer ONLY using the context above.
        If missing, answer: "Not found in document."
        """.strip()

    return prompt


