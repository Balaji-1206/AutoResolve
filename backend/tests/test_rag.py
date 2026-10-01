import os
from pathlib import Path
from app.rag.pipeline import RAGPipeline


def test_rag_search():
    repo_root = Path(__file__).resolve().parent.parent.parent
    knowledge_path = str(repo_root / "knowledge")
    
    rag = RAGPipeline(knowledge_path)
    question = "How long do refunds take?"
    results = rag.search(question, top_k=3)

    assert len(results) > 0
    top_doc = results[0]["document"]
    assert "document_id" in top_doc
    assert top_doc["document_id"] in ["POL-REFUND-001", "FAQ-REFUND-001"]
    assert results[0]["score"] > 0.4


def test_rag_out_of_scope():
    repo_root = Path(__file__).resolve().parent.parent.parent
    knowledge_path = str(repo_root / "knowledge")
    
    rag = RAGPipeline(knowledge_path)
    question = "What is the secret recipe for baking chocolate muffins?"
    results = rag.search(question, top_k=3)

    assert len(results) == 0


def test_reindex_idempotency():
    repo_root = Path(__file__).resolve().parent.parent.parent
    knowledge_path = str(repo_root / "knowledge")
    
    rag = RAGPipeline(knowledge_path)
    initial_count = rag.vector_store.total_vectors
    assert initial_count == 192

    rag._initialize_index(force_rebuild=True)
    assert rag.vector_store.total_vectors == 192