"""
FastAPI Router for RAG Operations.

Endpoints:
- POST /api/v1/rag/query: Grounded question answering with policy citations
- GET /api/v1/rag/status: Diagnostic health check for vector store and Ollama
- POST /api/v1/rag/reindex: Dynamic re-indexing of knowledge documents
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
import httpx
from app.models.rag import (
    RAGQueryRequest,
    RAGQueryResponse,
    RAGStatusResponse,
    ReindexResponse
)
from app.rag.pipeline import RAGPipeline

router = APIRouter(prefix="/rag", tags=["RAG Knowledge Engine"])


def get_rag_pipeline(request: Request) -> RAGPipeline:
    """
    Dependency injector retrieving the pre-warmed RAGPipeline singleton
    stored on app.state during the application lifespan startup.
    """
    pipeline = getattr(request.app.state, "rag_pipeline", None)
    if pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG pipeline is not yet initialized."
        )
    return pipeline


@router.post(
    "/query",
    response_model=RAGQueryResponse,
    summary="Query Knowledge Base with Grounded Citations",
    description="Embeds query, searches FAISS for relevant policy sections, and generates a grounded response using Qwen3 8B with source citations."
)
async def query_rag(
    request_data: RAGQueryRequest,
    rag: RAGPipeline = Depends(get_rag_pipeline)
) -> RAGQueryResponse:
    try:
        result = await rag.query_async(
            query=request_data.query,
            top_k=request_data.top_k
        )
        return RAGQueryResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query execution failed: {str(e)}"
        )


@router.get(
    "/status",
    response_model=RAGStatusResponse,
    summary="Check RAG System Status & Health",
    description="Returns vector index statistics, chunk counts, model information, and verifies connectivity to the local Ollama LLM service."
)
async def get_rag_status(
    rag: RAGPipeline = Depends(get_rag_pipeline)
) -> RAGStatusResponse:
    info = rag.status()

    # Verify Ollama connectivity
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{rag.generator.base_url.replace('/v1', '')}/api/tags")
            ollama_ok = (resp.status_code == 200)
    except Exception:
        ollama_ok = False

    return RAGStatusResponse(
        status="HEALTHY" if (info["indexed_chunks"] > 0 and ollama_ok) else "DEGRADED",
        indexed_chunks=info["indexed_chunks"],
        dimension=info["dimension"],
        knowledge_path=info["knowledge_path"],
        min_score_threshold=info["min_score_threshold"],
        model=info["model"],
        cache_file=info["cache_file"],
        cache_exists=info["cache_exists"],
        ollama_connected=ollama_ok
    )


@router.post(
    "/reindex",
    response_model=ReindexResponse,
    summary="Rebuild Vector Index",
    description="Forces re-parsing of all Markdown policies and rebuilds the FAISS vector cache from scratch."
)
async def reindex_knowledge(
    rag: RAGPipeline = Depends(get_rag_pipeline)
) -> ReindexResponse:
    try:
        rag._initialize_index(force_rebuild=True)
        return ReindexResponse(
            status="SUCCESS",
            message="Knowledge base successfully reindexed.",
            indexed_chunks=rag.vector_store.total_vectors
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {str(e)}"
        )
