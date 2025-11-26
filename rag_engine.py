# rag_engine.py
from typing import List, Dict, Any
from embeddings import embed_texts_openai
from vectorstore import InMemoryVectorStore
import numpy as np

class RAGEngine:
    def __init__(self, vectorstore: InMemoryVectorStore):
        self.vs = vectorstore

    def embed_and_add(self, chunks: List[str], metadatas: List[Dict[str,Any]]):
        vectors = embed_texts_openai(chunks)
        self.vs.add(vectors, metadatas)

    def retrieve(self, query: str, top_k: int = 4):
        qvec = embed_texts_openai([query])[0]
        results = self.vs.similarity_search(qvec, top_k=top_k)
        # results = list of (metadata, score)
        # convert to list of metadata dicts with score
        return [{"text": m["text"], **{k:v for k,v in m.items() if k!="text"}, "score": score} for m, score in results]
