from openai import OpenAI
import numpy as np

class RAGEngine:

    def __init__(self, vectorstore):
        self.vectorstore = vectorstore
        self.client = OpenAI()

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
    def retrieve(self, query: str, top_k: int = 4):
        query_vector = self.embed_query(query)
        return self.vectorstore.similarity_search(query_vector, top_k=top_k)
