"""
FAISS Vector Store for AcmeCommerce RAG.

Provides:
- Cosine similarity search via FAISS IndexFlatIP (Inner Product over L2-normalized vectors)
- Score threshold cutoff filtering to discard irrelevant noise
- Disk persistence (save/load) for instant application startup
"""

"""
Vector Store for AcmeCommerce RAG.

Provides:
- Cosine similarity search via FAISS IndexFlatIP (Inner Product over L2-normalized vectors)
  or high-performance NumPy fallback when FAISS C++ extensions are blocked by OS security policy.
- Score threshold cutoff filtering to discard irrelevant noise
- Disk persistence (save/load) for instant application startup
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

try:
    import faiss
    HAS_FAISS = True
except Exception as e:
    HAS_FAISS = False
    logger.info("FAISS native library unavailable (%s); using optimized NumPy vector store.", e)


class VectorStore:

    def __init__(self, dimension: int):
        self.dimension = dimension
        self.documents: List[Dict[str, Any]] = []
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(dimension)
        else:
            self.vectors = np.empty((0, dimension), dtype=np.float32)

    @property
    def total_vectors(self) -> int:
        if HAS_FAISS:
            return self.index.ntotal
        return len(self.vectors)

    def clear(self):
        """
        Resets the vector index and clears all document metadata.
        """
        if HAS_FAISS:
            self.index.reset()
        else:
            self.vectors = np.empty((0, self.dimension), dtype=np.float32)
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
        if HAS_FAISS:
            self.index.add(vectors)
        else:
            if len(self.vectors) == 0:
                self.vectors = vectors
            else:
                self.vectors = np.vstack([self.vectors, vectors])
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
        if self.total_vectors == 0:
            return []

        query_vector = query_vector.astype(np.float32)
        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(1, -1)

        if HAS_FAISS:
            scores, indices = self.index.search(query_vector, min(top_k, self.total_vectors))
            score_arr = scores[0]
            index_arr = indices[0]
        else:
            # Cosine similarity for L2-normalized vectors via dot product
            raw_scores = np.dot(self.vectors, query_vector.T).flatten()
            k = min(top_k, len(self.vectors))
            best_order = np.argsort(raw_scores)[::-1][:k]
            score_arr = raw_scores[best_order]
            index_arr = best_order

        results = []
        for score, idx in zip(score_arr, index_arr):
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
        Persists vector index and document metadata JSON to disk.
        """
        os.makedirs(os.path.dirname(os.path.abspath(index_file_path)), exist_ok=True)
        if HAS_FAISS:
            faiss.write_index(self.index, index_file_path)
        else:
            npy_path = index_file_path if index_file_path.endswith(".npy") else f"{index_file_path}.npy"
            np.save(npy_path, self.vectors)
        with open(metadata_file_path, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, indent=2)

    def load(self, index_file_path: str, metadata_file_path: str) -> bool:
        """
        Loads vector index and document metadata JSON from disk if both exist.
        Returns True on success, False if files are missing or incompatible.
        """
        if not os.path.exists(metadata_file_path):
            return False

        if HAS_FAISS and os.path.exists(index_file_path):
            try:
                self.index = faiss.read_index(index_file_path)
                with open(metadata_file_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                return True
            except Exception:
                pass

        npy_path = index_file_path if index_file_path.endswith(".npy") else f"{index_file_path}.npy"
        if os.path.exists(npy_path):
            try:
                self.vectors = np.load(npy_path)
                with open(metadata_file_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                return True
            except Exception:
                pass

        return False
