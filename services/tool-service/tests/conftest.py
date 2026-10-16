"""
Pytest configuration and fixtures for Tool Service test suite.
"""

import sys
from pathlib import Path

# Add services/tool-service to sys.path so 'app' is importable
tool_service_root = Path(__file__).resolve().parent.parent
if str(tool_service_root) not in sys.path:
    sys.path.insert(0, str(tool_service_root))
