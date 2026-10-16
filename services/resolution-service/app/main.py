"""
AutoResolve AI - Resolution & Investigation Microservice.

Coordinates multi-agent customer support investigations combining
grounded policy retrieval (RAG) and operational tool execution.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.resolution import router as resolution_router
from app.clients.rag_client import RAGClient
from app.clients.tool_client import ToolClient
from app.workflows.investigation import InvestigationWorkflow
from app.workflows.reasoning import QwenReasoner

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Context Manager.

    Code before yield runs once during server startup:
    - Pre-warms HTTP client connections to RAG and Tool services.
    - Attaches the singleton InvestigationWorkflow to app.state.

    Code after yield runs during server shutdown:
    - Gracefully closes underlying network connection pools.
    """
    if not getattr(app.state, "workflow", None):
        rag_client = RAGClient()
        tool_client = ToolClient()
        reasoner = QwenReasoner()

        app.state.workflow = InvestigationWorkflow(
            rag_client=rag_client,
            tool_client=tool_client,
            reasoner=reasoner,
        )

    yield

    # Teardown logic
    if hasattr(app.state, "workflow") and app.state.workflow:
        await app.state.workflow.close()
        app.state.workflow = None


app = FastAPI(
    title="AutoResolve Resolution Service",
    description="Investigation & Orchestration Engine connecting Policy RAG with Operational Tools",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(resolution_router, prefix="/api/v1")


@app.get("/", tags=["General"])
def root():
    """
    Root endpoint returning service identity, status, and API documentation link.
    """
    return {
        "service": "AutoResolve Resolution Service",
        "description": "Customer Investigation & Policy Resolution Engine",
        "status": "online",
        "version": "0.1.0",
        "port": 8002,
        "documentation": "/docs",
    }


@app.get("/health", tags=["General"])
def health():
    """
    Liveness and readiness probe for health monitors and container orchestrators.
    """
    return {
        "status": "healthy",
        "service": "AutoResolve Resolution Service",
    }
