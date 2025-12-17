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
                    # Ensure doc_id is in chunk
                    if "doc_id" not in c:
                        c["doc_id"] = doc_id
                    self.chunks.append((c, 0.0))

            except Exception as e:
                print(f"Error loading {filename}: {e}")

    # --------------------------------------------------------
    # Add a new processed document (save JSON + load into memory)
    # --------------------------------------------------------
    def add_document(self, doc_id: str, file_name: str, chunk_list: List[Dict[str, Any]]):
        """Save a document as a JSON file and load into memory."""

        # Inject doc_id into all chunks
        for c in chunk_list:
            c["doc_id"] = doc_id

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
    # --------------------------------------------------------
    # Similarity Search (Vectorized)
    # --------------------------------------------------------
    # --------------------------------------------------------
    # Similarity Search (Vectorized)
    # --------------------------------------------------------
    def similarity_search(
        self,
        query_vector: List[float],
        top_k: int = 4,
        doc_ids: List[str] = None
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Retrieve top-K most similar chunks using vectorized operations."""

        if not self.chunks:
            return []

        # Prepare data
        q = np.array(query_vector)
        q_norm = np.linalg.norm(q)
        
        # Avoid division by zero
        if q_norm < 1e-8:
            return []

        # Filter chunks if doc_ids provided
        # We need to keep track of original indices if we filter
        if doc_ids is not None:
            allowed_set = set(doc_ids)
            # Create a list of (index, chunk_tuple) for allowed chunks
            filtered_indices_chunks = [
                (i, c) for i, c in enumerate(self.chunks)
                if c[0]["doc_id"] in allowed_set
            ]
            
            if not filtered_indices_chunks:
                return []
                
            # Unzip
            indices = [x[0] for x in filtered_indices_chunks]
            active_chunks = [x[1] for x in filtered_indices_chunks]
        else:
            indices = list(range(len(self.chunks)))
            active_chunks = self.chunks

        # Extract embeddings matrix from active chunks
        embeddings = [c[0]["embedding"] for c in active_chunks]
        
        if not embeddings:
            return []
            
        E = np.array(embeddings)
        
        # Calculate cosine similarity: (E . q) / (|E| * |q|)
        # Dot product
        dot_products = np.dot(E, q)
        
        # Norms of all embeddings
        E_norms = np.linalg.norm(E, axis=1)
        
        # Avoid division by zero for embeddings
        E_norms[E_norms < 1e-8] = 1e-8
        
        # Cosine scores
        scores = dot_products / (E_norms * q_norm)
        
        # Get top_k indices (relative to active_chunks)
        if len(scores) <= top_k:
            top_relative_indices = np.argsort(scores)[::-1]
        else:
            top_relative_indices = np.argpartition(scores, -top_k)[-top_k:]
            top_relative_indices = top_relative_indices[np.argsort(scores[top_relative_indices])[::-1]]
            
        # Construct result
        results = []
        for rel_idx in top_relative_indices:
            # Map back to chunk
            chunk = active_chunks[rel_idx][0]
            score = float(scores[rel_idx])
            results.append((chunk, score))
            
        return results
