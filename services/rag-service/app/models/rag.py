"""
Pydantic Request and Response Schemas for AutoResolve RAG Microservice.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="Customer support question or inquiry",
        example="Can I get a refund for an item delivered 15 days ago?"
    )
    top_k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Number of top policy chunks to retrieve from FAISS",
        example=3
    )


class CitationItem(BaseModel):
    document_id: str = Field(..., description="Unique document ID (e.g. POL-REFUND-001)")
    domain: str = Field(..., description="Business domain (e.g. refunds, shipping)")
    authority: str = Field(..., description="Authority level: authoritative, explanatory, or operational")
    section: str = Field(..., description="Section title in the policy/FAQ")
    source: str = Field(..., description="File path relative to repository")
    file_name: str = Field(..., description="Base filename")
    score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")
    explicitly_cited: bool = Field(..., description="Whether Qwen explicitly cited this in its response text")


class RetrievedChunkItem(BaseModel):
    document_id: str
    section: str
    score: float
    snippet: str


class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[CitationItem]
    retrieved_chunks: List[RetrievedChunkItem]
    is_grounded: bool
    model: str
    status: str


class RAGStatusResponse(BaseModel):
    status: str
    indexed_chunks: int
    dimension: int
    knowledge_path: str
    min_score_threshold: float
    model: str
    cache_file: str
    cache_exists: bool
    ollama_connected: bool


class ReindexResponse(BaseModel):
    status: str
    message: str
    indexed_chunks: int
