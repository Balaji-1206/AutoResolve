"""
AutoResolve AI - Tool Calling Microservice.

Exposes operational APIs for multi-agent reasoning and deterministic state lookup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.tools import router as tools_router

app = FastAPI(
    title="AutoResolve Tool Service",
    description="Operational Tool & Function Calling Microservice for AutoResolve AI",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for cross-service communication and frontend UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Tool Service Router under /api/v1
app.include_router(tools_router, prefix="/api/v1")


@app.get("/", tags=["General"])
def root():
    """
    Root endpoint returning service identity and status.
    """
    return {
        "service": "AutoResolve Tool Service",
        "status": "online",
        "version": "0.1.0",
        "documentation": "/docs",
    }


@app.get("/health", tags=["General"])
def health():
    """
    Liveness and readiness health check probe.
    """
    return {
        "status": "healthy",
        "service": "AutoResolve Tool Service",
    }
