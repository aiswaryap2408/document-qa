import json
import os
import numpy as np
from typing import List, Dict, Any, Tuple

class InMemoryVectorStore:

    def __init__(self, storage_path="vectorstore.json"):
        self.storage_path = storage_path
        self.store = {}  # {doc_id: [chunks]}
        self.load()

    @property
    def document_names(self):
        return list(self.store.keys())

    def add_document(self, doc_id, chunks):
        """Add or replace a document in the vectorstore."""
        self.store[doc_id] = chunks
        self.save()

    def delete_document(self, doc_id):
        """Remove a document from the vectorstore."""
        if doc_id in self.store:
            del self.store[doc_id]
            self.save()

    def get_document(self, doc_id):
        return self.store.get(doc_id, [])

    # ----------------------------------------------------
    # Cosine similarity calculation
    # ----------------------------------------------------
    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        a = np.array(a)
        b = np.array(b)
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)

    # ----------------------------------------------------
    # Similarity Search Across All Chunks
    # ----------------------------------------------------
    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 4
    ) -> List[Tuple[Dict[str, Any], float]]:

        scored = []

        for doc_id, chunks in self.store.items():
            for chunk in chunks:
                score = self.cosine_similarity(query_vector, chunk["embedding"])
                scored.append((chunk, score))

        # Sort descending by similarity
        scored.sort(key=lambda x: x[1], reverse=True)

        return scored[:top_k]

    # ----------------------------------------------------
    # Persistent save/load
    # ----------------------------------------------------
    def save(self):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(self.store, f, ensure_ascii=False, indent=2)

    def load(self):
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r", encoding="utf-8") as f:
                self.store = json.load(f)
        else:
            self.store = {}
