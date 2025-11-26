# embeddings.py
from openai import OpenAI
import os
import numpy as np
from typing import List

OPENAI_EMBED_MODEL = "text-embedding-3-small"

def get_openai_client(api_key: str = None):
    if api_key is None:
        api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key)

def embed_texts_openai(texts: List[str], api_key: str = None, model: str = OPENAI_EMBED_MODEL) -> List[np.ndarray]:
    client = get_openai_client(api_key)
    resp = client.embeddings.create(model=model, input=texts)
    vectors = []
    for d in resp.data:
        vectors.append(np.array(d.embedding, dtype=np.float32))
    return vectors
