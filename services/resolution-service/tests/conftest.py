"""
Pytest configuration and path setup for Resolution Service tests.
"""

from pathlib import Path
import sys

resolution_root = Path(__file__).resolve().parent.parent
if str(resolution_root) not in sys.path:
    sys.path.insert(0, str(resolution_root))
