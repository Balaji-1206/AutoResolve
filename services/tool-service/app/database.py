"""
Database connection provider for Tool Service.

Manages connections to the shared SQLite operational database (`data/autoresolve.db`).
"""

import os
from pathlib import Path
import sqlite3
from typing import Optional


def find_db_path() -> Path:
    """Locates the SQLite database file across relative workspace candidates."""
    env_path = os.getenv("AUTORESOLVE_DB_PATH")
    if env_path and Path(env_path).is_file():
        return Path(env_path)

    current_dir = Path(__file__).resolve().parent
    candidates = [
        current_dir.parent.parent.parent / "data" / "autoresolve.db",
        current_dir.parent.parent / "data" / "autoresolve.db",
        Path("data/autoresolve.db").resolve(),
    ]

    for c in candidates:
        if c.is_file():
            return c

    # Return default relative path in repo data dir
    return candidates[0]


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """
    Returns an open SQLite connection with Row factory and WAL mode.
    """
    target = db_path or find_db_path()
    conn = sqlite3.connect(str(target), timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn
