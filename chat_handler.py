# chat_handler.py
import os
from openai import OpenAI
import google.generativeai as genai
from typing import List, Dict, Any

def get_openai_client(api_key: str = None):
    if api_key is None:
        api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)

def generate_with_openai(system_prompt: str, context_chunks: List[Dict[str,Any]], question: str, model: str = "gpt-4.1-mini", api_key: str = None) -> str:
    client = get_openai_client(api_key)
    # build context
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(context_chunks)])
    messages = [
        {"role":"system", "content": system_prompt},
        {"role":"user", "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer using only the context. If not found, say 'Not found in document.'"}
    ]
    resp = client.chat.completions.create(model=model, messages=messages)
    return resp.choices[0].message.content

def generate_with_gemini(system_prompt: str, context_chunks: List[Dict[str,Any]], question: str, model: str = "gemini-1.5-pro", api_key: str = None) -> str:
    gem_api_key = api_key or os.getenv("GEMINI_API_KEY")
    if not gem_api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=gem_api_key)

    # Build context text safely
    context = "\n\n".join([f"[chunk {i+1}] {c['text']}" for i, c in enumerate(context_chunks)])

    # Use single quotes for the outer string and escape inner quotes
    prompt = (
        "SYSTEM:\n"
        f"{system_prompt}\n\n"
        "CONTEXT:\n"
        f"{context}\n\n"
        "QUESTION:\n"
        f"{question}\n\n"
        "Answer concisely using ONLY the context. "
        "If not found, say 'Not found in document.'"
    )

    model_ai = genai.GenerativeModel(model)
    res = model_ai.generate_content(prompt)
    return getattr(res, "text", str(res))
