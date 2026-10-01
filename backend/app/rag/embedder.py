"""
Embedding generator for AcmeCommerce RAG pipeline.

Uses sentence-transformers (all-MiniLM-L6-v2, 384 dimensions)
with L2 vector normalization for exact cosine similarity searches in FAISS.
"""

from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer


class Embedder:
    _instance = None

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        if hasattr(self.model, "get_embedding_dimension"):
            self.dimension = self.model.get_embedding_dimension()
        else:
            self.dimension = self.model.get_sentence_embedding_dimension()

    def embed(self, texts: Union[str, List[str]], normalize: bool = True) -> np.ndarray:
        """
        Embeds a single string or list of strings into float32 numpy arrays.
        When normalize=True, vectors are scaled to unit length so that
        inner-product (IP) equates to cosine similarity.
        """
        if isinstance(texts, str):
            texts = [texts]

        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=False
        ).astype(np.float32)

        if normalize:
            # L2 normalization for cosine similarity
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            embeddings = embeddings / norms

        return embeddings