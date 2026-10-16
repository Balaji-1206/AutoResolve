"""
Pytest configuration and fixtures for RAG Service test suite.
"""

import sys
from pathlib import Path

# Add services/rag-service to sys.path so 'app' is importable
rag_service_root = Path(__file__).resolve().parent.parent
if str(rag_service_root) not in sys.path:
    sys.path.insert(0, str(rag_service_root))
