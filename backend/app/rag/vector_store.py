"""
FAISS Vector Store for AcmeCommerce RAG.

Provides:
- Cosine similarity search via FAISS IndexFlatIP (Inner Product over L2-normalized vectors)
- Score threshold cutoff filtering to discard irrelevant noise
- Disk persistence (save/load) for instant application startup
"""

import json
import os
from typing import Any, Dict, List, Optional
import faiss
import numpy as np


class VectorStore:

    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)
        self.documents: List[Dict[str, Any]] = []

    @property
    def total_vectors(self) -> int:
        return self.index.ntotal

    def clear(self):
        """
        Resets the FAISS index and clears all document metadata.
        """
        self.index.reset()
        self.documents = []

    def add(self, vectors: np.ndarray, documents: List[Dict[str, Any]]):
        """
        Adds normalized vectors and their corresponding chunk metadata to the index.
        """
        if len(vectors) != len(documents):
            raise ValueError(
                f"Mismatch: {len(vectors)} vectors vs {len(documents)} document metadata items"
            )

        vectors = vectors.astype(np.float32)
        self.index.add(vectors)
        self.documents.extend(documents)

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 3,
        min_score_threshold: float = 0.35
    ) -> List[Dict[str, Any]]:
        """
        Searches the index for top_k most similar chunks.
        Discards matches falling below min_score_threshold.
        """
        if self.index.ntotal == 0:
            return []

        query_vector = query_vector.astype(np.float32)
        scores, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue

            similarity = float(score)
            # Threshold cutoff filtering: discard irrelevant noise
            if similarity < min_score_threshold:
                continue

            results.append({
                "document": self.documents[idx],
                "score": round(similarity, 4),
                "distance": round(similarity, 4)  # Backward compatibility
            })

        return results

    def save(self, index_file_path: str, metadata_file_path: str):
        """
        Persists FAISS index binary and document metadata JSON to disk.
        """
        os.makedirs(os.path.dirname(os.path.abspath(index_file_path)), exist_ok=True)
        faiss.write_index(self.index, index_file_path)
        with open(metadata_file_path, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, indent=2)

    def load(self, index_file_path: str, metadata_file_path: str) -> bool:
        """
        Loads FAISS index binary and document metadata JSON from disk if both exist.
        Returns True on success, False if files are missing.
        """
        if not (os.path.exists(index_file_path) and os.path.exists(metadata_file_path)):
            return False

        self.index = faiss.read_index(index_file_path)
        with open(metadata_file_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)
        return True