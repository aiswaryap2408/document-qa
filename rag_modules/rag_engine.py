from openai import OpenAI
import numpy as np
from typing import Any

class RAGEngine:

    def __init__(self, vectorstore):
        self.vectorstore = vectorstore
        self.client = OpenAI()

    # ---------------------------------------------------------
    # Compute embedding for user queries
    # ---------------------------------------------------------
    def embed_chunks(self, chunks: list[dict[str, Any]]):
        """Adds embedding to each chunk using batch processing."""
        if not chunks:
            return chunks
            
        texts = [c["text"] for c in chunks]
        try:
            resp = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            embeddings = [d.embedding for d in resp.data]
            for i, emb in enumerate(embeddings):
                chunks[i]["embedding"] = emb
            return chunks
        except Exception as e:
            print(f"Error in batch embedding: {e}")
            # Fallback to zeros if API fails (so indexing doesn't crash)
            for c in chunks:
                if "embedding" not in c:
                    c["embedding"] = np.zeros(1536).tolist()
            return chunks

    # ---------------------------------------------------------
    # Compute embedding for user queries
    # ---------------------------------------------------------
    def embed_query(self, text: str):
        try:
            emb = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return emb.data[0].embedding
        except Exception:
            return np.zeros(1536).tolist()

    # ---------------------------------------------------------
    # Retrieve relevant chunks using vectorstore similarity search
    # ---------------------------------------------------------
    def retrieve(self, query: str, top_k: int = 4, doc_ids: list[str] = None):
        query_vector = self.embed_query(query)
        return self.vectorstore.similarity_search(query_vector, top_k=top_k, doc_ids=doc_ids)
