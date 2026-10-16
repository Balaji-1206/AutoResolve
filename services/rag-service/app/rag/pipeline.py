"""
Production RAG Pipeline Orchestrator for AcmeCommerce.

Connects:
1. Document Loader (Markdown with YAML frontmatter)
2. Metadata-Aware Markdown Chunker
3. Embedding Generator (L2 normalized vectors)
4. FAISS Vector Store (Cosine similarity, threshold cutoff, disk caching)
5. Grounded Qwen3 8B Generator (Strict citations, anti-hallucination guardrails)
"""

import os
from typing import Any, Dict, List, Optional
from app.rag.loader import load_documents
from app.rag.chunker import chunk_document
from app.rag.embedder import Embedder
from app.rag.vector_store import VectorStore
from app.rag.generator import QwenGenerator


class RAGPipeline:

    def __init__(
        self,
        knowledge_path: str = "knowledge",
        index_dir: Optional[str] = None,
        force_rebuild: bool = False,
        min_score_threshold: float = 0.35,
        ollama_model: Optional[str] = None
    ):
        self.knowledge_path = knowledge_path
        self.min_score_threshold = min_score_threshold
        
        # Default index persistence directory
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.index_dir = index_dir or os.path.join(base_dir, "data", "vector_cache")
        self.index_file = os.path.join(self.index_dir, "faiss_index.bin")
        self.metadata_file = os.path.join(self.index_dir, "chunks_metadata.json")

        # 1. Initialize components
        self.embedder = Embedder()
        self.vector_store = VectorStore(dimension=self.embedder.dimension)
        self.generator = QwenGenerator(model=ollama_model)

        # 2. Build or load index
        self._initialize_index(force_rebuild)

    def _initialize_index(self, force_rebuild: bool):
        """
        Attempts to load cached FAISS index from disk.
        If cache is absent or force_rebuild is True, rebuilds from markdown files.
        """
        if not force_rebuild and self.vector_store.load(self.index_file, self.metadata_file):
            return

        # Clear any existing vectors and metadata before fresh indexing
        self.vector_store.clear()

        # Load and chunk markdown documents
        documents = load_documents(self.knowledge_path)
        chunks = []
        for doc in documents:
            doc_chunks = chunk_document(doc)
            chunks.extend(doc_chunks)

        if not chunks:
            return

        # Generate embeddings
        texts = [c["text"] for c in chunks]
        vectors = self.embedder.embed(texts)

        # Populate vector store
        self.vector_store.add(vectors, chunks)

        # Save to disk cache
        try:
            self.vector_store.save(self.index_file, self.metadata_file)
        except Exception:
            pass

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves top_k matching chunks that pass the minimum score threshold.
        """
        query_vector = self.embedder.embed(query)
        return self.vector_store.search(
            query_vector,
            top_k=top_k,
            min_score_threshold=self.min_score_threshold
        )

    def format_citations(
        self,
        retrieved_chunks: List[Dict[str, Any]],
        cited_doc_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Correlates cited document IDs with retrieved chunk metadata.
        """
        citations_map = {}
        for item in retrieved_chunks:
            doc = item.get("document", {})
            doc_id = doc.get("document_id")
            if not doc_id:
                continue

            if doc_id not in citations_map:
                citations_map[doc_id] = {
                    "document_id": doc_id,
                    "domain": doc.get("domain", "general"),
                    "authority": doc.get("authority", "explanatory"),
                    "section": doc.get("section", ""),
                    "source": doc.get("source", ""),
                    "file_name": doc.get("file_name", ""),
                    "score": item.get("score", 0.0),
                    "explicitly_cited": (doc_id in cited_doc_ids)
                }

        # Return list sorted with explicitly cited documents first
        citations_list = list(citations_map.values())
        citations_list.sort(key=lambda x: (not x["explicitly_cited"], -x["score"]))
        return citations_list

    def query(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Synchronous end-to-end RAG query.
        """
        retrieved_chunks = self.search(query, top_k=top_k)

        # Guardrail: Out of scope threshold refusal
        if not retrieved_chunks:
            return {
                "query": query,
                "answer": (
                    "I apologize, but this inquiry does not match any current AcmeCommerce "
                    "published policies, FAQs, or operational procedures. Please contact our support team."
                ),
                "citations": [],
                "retrieved_chunks": [],
                "is_grounded": False,
                "model": self.generator.model,
                "status": "OUT_OF_SCOPE"
            }

        # Generate grounded response via Qwen
        gen_result = self.generator.generate(query, retrieved_chunks)
        citations = self.format_citations(retrieved_chunks, gen_result["cited_document_ids"])

        return {
            "query": query,
            "answer": gen_result["answer"],
            "citations": citations,
            "retrieved_chunks": [
                {
                    "document_id": c["document"]["document_id"],
                    "section": c["document"]["section"],
                    "score": c["score"],
                    "snippet": c["document"].get("raw_text", "")[:180] + "..."
                }
                for c in retrieved_chunks
            ],
            "is_grounded": True,
            "model": gen_result["model"],
            "status": gen_result["status"]
        }

    async def query_async(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Asynchronous end-to-end RAG query for FastAPI endpoints.
        """
        retrieved_chunks = self.search(query, top_k=top_k)

        if not retrieved_chunks:
            return {
                "query": query,
                "answer": (
                    "I apologize, but this inquiry does not match any current AcmeCommerce "
                    "published policies, FAQs, or operational procedures. Please contact our support team."
                ),
                "citations": [],
                "retrieved_chunks": [],
                "is_grounded": False,
                "model": self.generator.model,
                "status": "OUT_OF_SCOPE"
            }

        gen_result = await self.generator.generate_async(query, retrieved_chunks)
        citations = self.format_citations(retrieved_chunks, gen_result["cited_document_ids"])

        return {
            "query": query,
            "answer": gen_result["answer"],
            "citations": citations,
            "retrieved_chunks": [
                {
                    "document_id": c["document"]["document_id"],
                    "section": c["document"]["section"],
                    "score": c["score"],
                    "snippet": c["document"].get("raw_text", "")[:180] + "..."
                }
                for c in retrieved_chunks
            ],
            "is_grounded": True,
            "model": gen_result["model"],
            "status": gen_result["status"]
        }

    def status(self) -> Dict[str, Any]:
        """
        Returns pipeline diagnostic information.
        """
        return {
            "indexed_chunks": self.vector_store.total_vectors,
            "dimension": self.embedder.dimension,
            "knowledge_path": self.knowledge_path,
            "min_score_threshold": self.min_score_threshold,
            "model": self.generator.model,
            "cache_file": self.index_file,
            "cache_exists": os.path.exists(self.index_file)
        }