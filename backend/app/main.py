"""
AutoResolve AI - Main FastAPI Application.

Autonomous Multi-Agent Customer Support & Operations Resolution System.
"""

from contextlib import asynccontextmanager
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.rag import router as rag_router
from app.rag.pipeline import RAGPipeline


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Context Manager.
    
    Code before `yield` runs once during server startup:
    - Pre-warms the RAGPipeline (loads FAISS index, embedder, and chunk metadata).
    - Attaches the singleton instance to `app.state.rag_pipeline` so all route
      handlers share the exact same in-memory models without reloading.
    
    Code after `yield` runs during server shutdown:
    - Performs resource cleanup.
    """
    repo_root = Path(__file__).resolve().parent.parent.parent
    knowledge_dir = os.getenv("KNOWLEDGE_PATH", str(repo_root / "knowledge"))
    cache_dir = os.getenv("VECTOR_CACHE_PATH", str(repo_root / "backend" / "data" / "vector_cache"))

    # Initialize RAG Pipeline singleton
    app.state.rag_pipeline = RAGPipeline(
        knowledge_path=knowledge_dir,
        index_dir=cache_dir
    )

    yield

    # Teardown logic
    app.state.rag_pipeline = None


app = FastAPI(
    title="AutoResolve AI",
    description="Autonomous Multi-Agent Customer Support & Operations Resolution Engine",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS) for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(rag_router, prefix="/api/v1")


@app.get("/", tags=["General"])
def root():
    """
    Root endpoint returning service identity and API documentation link.
    """
    return {
        "service": "AutoResolve AI",
        "description": "Multi-Agent Support & Operations Resolution Microservice",
        "status": "online",
        "version": "0.1.0",
        "documentation": "/docs"
    }


@app.get("/health", tags=["General"])
def health():
    """
    Liveness probe endpoint for health monitoring and container orchestrators.
    """
    return {
        "status": "healthy"
    }