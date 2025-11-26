# vectorstore.py
from typing import List, Dict, Any, Tuple
import numpy as np
import hashlib

class InMemoryVectorStore:
    def __init__(self):
        self.embeddings: np.ndarray = None  # shape (n, dim)
        self.metadatas: List[Dict[str, Any]] = []
        self.ids: List[str] = []

    def add(self, vectors: List[np.ndarray], metadatas: List[Dict[str, Any]]):
        import numpy as np
        if len(vectors) != len(metadatas):
            raise ValueError("vectors and metadatas length mismatch")
        arr = np.vstack(vectors).astype(np.float32)
        ids = [hashlib.sha1(str(m).encode()).hexdigest() for m in metadatas]
        if self.embeddings is None:
            self.embeddings = arr
            self.metadatas = metadatas.copy()
            self.ids = ids
        else:
            self.embeddings = np.vstack([self.embeddings, arr])
            self.metadatas.extend(metadatas)
            self.ids.extend(ids)

    def similarity_search(self, query_vector: np.ndarray, top_k: int = 4) -> List[Tuple[Dict[str, Any], float]]:
        import numpy as np
        if self.embeddings is None or len(self.metadatas) == 0:
            return []
        q = query_vector.astype(np.float32)
        dots = np.dot(self.embeddings, q)
        norms_emb = np.linalg.norm(self.embeddings, axis=1)
        norm_q = np.linalg.norm(q) + 1e-12
        cosines = dots / (norms_emb * norm_q + 1e-12)
        idx = np.argsort(-cosines)[:top_k]
        results = []
        for i in idx:
            results.append((self.metadatas[i], float(cosines[i])))
        return results
