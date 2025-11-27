import os
import json
import numpy as np
from typing import List, Tuple, Dict, Any


class InMemoryVectorStore:

    # --------------------------------------------------------
    # Initialization
    # --------------------------------------------------------
    def __init__(self, storage_dir="processed_docs"):
        os.makedirs(storage_dir, exist_ok=True)

        self.storage_dir = storage_dir

        # Internal private store (no setter errors)
        self._document_names: List[str] = []
        self.chunks: List[Tuple[Dict[str, Any], float]] = []  # (chunk_dict, score)

        # Load existing JSON documents at startup
        self._load_all_documents()

    # --------------------------------------------------------
    # Expose document names (read-only)
    # --------------------------------------------------------
    @property
    def document_names(self) -> List[str]:
        return self._document_names

    # --------------------------------------------------------
    # Load all docs from storage directory
    # --------------------------------------------------------
    def _load_all_documents(self):
        for filename in os.listdir(self.storage_dir):
            if not filename.endswith(".json"):
                continue

            full_path = os.path.join(self.storage_dir, filename)

            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    doc_json = json.load(f)

                doc_id = doc_json["doc_id"]
                self._document_names.append(doc_id)

                # Add each chunk with score=0 (default)
                for c in doc_json["chunks"]:
                    self.chunks.append((c, 0.0))

            except Exception as e:
                print(f"Error loading {filename}: {e}")

    # --------------------------------------------------------
    # Add a new processed document (save JSON + load into memory)
    # --------------------------------------------------------
    def add_document(self, doc_id: str, file_name: str, chunk_list: List[Dict[str, Any]]):
        """Save a document as a JSON file and load into memory."""

        # Prepare JSON structure
        doc_json = {
            "doc_id": doc_id,
            "file_name": file_name,
            "chunks": chunk_list
        }

        # Save to file
        file_path = os.path.join(self.storage_dir, f"{doc_id}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(doc_json, f, indent=2)

        # Load into memory
        self._document_names.append(doc_id)
        for c in chunk_list:
            self.chunks.append((c, 0.0))

    # --------------------------------------------------------
    # Delete a document from storage + memory
    # --------------------------------------------------------
    def delete_document(self, doc_id: str):
        """Remove a stored document JSON and delete its chunks."""

        # Delete JSON file
        json_path = os.path.join(self.storage_dir, f"{doc_id}.json")
        if os.path.exists(json_path):
            os.remove(json_path)

        # Remove chunks in memory
        self.chunks = [
            (chunk, score)
            for (chunk, score) in self.chunks
            if chunk.get("doc_id") != doc_id
        ]

        # Remove from names
        self._document_names = [
            d for d in self._document_names if d != doc_id
        ]

    # --------------------------------------------------------
    # Similarity Search
    # --------------------------------------------------------
    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 4
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Retrieve top-K most similar chunks."""

        if not self.chunks:
            return []

        q = np.array(query_vector)

        scored = []
        for (chunk, _) in self.chunks:
            emb = np.array(chunk["embedding"])

            # Prevent dimension mismatch crashing
            if emb.shape != q.shape:
                continue

            # Cosine similarity
            score = float(np.dot(q, emb) /
                          (np.linalg.norm(q) * np.linalg.norm(emb) + 1e-8))

            scored.append((chunk, score))

        # Sort by descending similarity
        scored.sort(key=lambda x: x[1], reverse=True)

        # Return top_k results
        return scored[: min(top_k, len(scored))]
