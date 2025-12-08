# chat_handler.py
import os
import requests
import json
from openai import OpenAI
import google.generativeai as genai
from typing import List, Dict, Any




def apply_token_budget(chunks, max_chars=20000):
    """
    Returns a subset of chunks that fits within the max_chars budget.
    20,000 chars is approx 5000 tokens. leaving 3000 for system+history+output.
    """
    current_chars = 0
    selected_chunks = []
    
    for chunk in chunks:
        # Crude estimate: 
        text_len = len(chunk['text']) + len(chunk['heading']) + 50 # overhead
        
        if current_chars + text_len > max_chars:
            break
            
        selected_chunks.append(chunk)
        current_chars += text_len
        
    return selected_chunks

def get_openai_client(api_key: str = None):
    if api_key is None:
        api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)

def generate_with_openai(system_prompt, context_chunks, conversation_history, question,
                         model="gpt-4.1", api_key=None):

    client = get_openai_client(api_key)

    # Build context text
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(context_chunks)])

    # Build conversation messages
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": "Use ONLY the retrieved context to answer. If answer not in context, say 'Not found in document.'"}
    ]

    # Append conversation history
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    # Add new question with context
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nUser Question: {question}"
    })

    # Ask model
    resp = client.chat.completions.create(
        model=model,
        messages=messages
    )

    return resp.choices[0].message.content

def generate_with_gemini(system_prompt, context_chunks, conversation_history, question,
                         model="gemini-1.5-pro", api_key=None):

    gem_api_key = api_key or os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=gem_api_key)

    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(context_chunks)])

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
    return getattr(res, "text", str(res))

def stream_openai(system_prompt, context_chunks, conversation_history, question,
                  model="gpt-4.1-mini", api_key=None):

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
                yield delta.content



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
            yield event.text

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


