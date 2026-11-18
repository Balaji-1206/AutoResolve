"""
AutoResolve AI - Resolution & Investigation Microservice.

Coordinates multi-agent customer support investigations combining
grounded policy retrieval (RAG) and operational tool execution.
"""

from contextlib import asynccontextmanager
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from app.api.resolution import router as resolution_router
from app.api.admin import router as admin_router
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
    - Configures durable AsyncSqliteSaver for LangGraph persistence.
    - Attaches the singleton InvestigationWorkflow to app.state.

    Code after yield runs during server shutdown:
    - Gracefully closes underlying network connection pools and checkpointer.
    """
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    checkpoints_path = repo_root / "data" / "checkpoints.db"
    checkpoints_path.parent.mkdir(parents=True, exist_ok=True)

    rag_client = RAGClient()
    tool_client = ToolClient()
    reasoner = QwenReasoner()

    async with AsyncSqliteSaver.from_conn_string(str(checkpoints_path)) as checkpointer:
        await checkpointer.setup()

        app.state.workflow = InvestigationWorkflow(
            rag_client=rag_client,
            tool_client=tool_client,
            reasoner=reasoner,
            checkpointer=checkpointer,
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
app.include_router(admin_router)


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
