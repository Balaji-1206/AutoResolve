"""
Database Persistence Provider for Resolution & Investigation Service.

Manages permanent storage of customer tickets, operational decisions,
and forensic resolution audit logs in SQLite (`data/autoresolve.db`).
"""

from datetime import datetime
import json
import logging
import os
from pathlib import Path
import sqlite3
from typing import Any, Dict, List, Optional

logger = logging.getLogger("autoresolve.resolution.database")


def find_db_path() -> Path:
    """Locates the SQLite database file across standard workspace paths."""
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

    return candidates[0]


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Returns a SQLite connection with Row factory and WAL mode."""
    target = db_path or find_db_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def save_ticket(ticket: Dict[str, Any]) -> None:
    """
    Inserts or updates a ticket record in SQLite.
    """
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO tickets (
                ticket_id, order_id, customer_id, customer_message,
                decision, status, summary, reasoning_summary,
                requires_human_review, review_reasons, duration_ms,
                created_at, updated_at
            ) VALUES (
                :ticket_id, :order_id, :customer_id, :customer_message,
                :decision, :status, :summary, :reasoning_summary,
                :requires_human_review, :review_reasons, :duration_ms,
                COALESCE((SELECT created_at FROM tickets WHERE ticket_id = :ticket_id), :created_at),
                :updated_at
            )
        """, {
            "ticket_id": ticket.get("ticket_id"),
            "order_id": ticket.get("order_id"),
            "customer_id": ticket.get("customer_id"),
            "customer_message": ticket.get("customer_message", ""),
            "decision": str(ticket.get("decision", "UNABLE_TO_DETERMINE")),
            "status": str(ticket.get("status", "COMPLETED")),
            "summary": ticket.get("summary", ""),
            "reasoning_summary": ticket.get("reasoning_summary", ""),
            "requires_human_review": 1 if ticket.get("requires_human_review") else 0,
            "review_reasons": ticket.get("review_reasons", "[]") if isinstance(ticket.get("review_reasons"), str) else json.dumps(ticket.get("review_reasons", [])),
            "duration_ms": float(ticket.get("duration_ms", 0.0)),
            "created_at": ticket.get("created_at", now_iso),
            "updated_at": now_iso,
        })
    conn.close()


def save_audit_log(
    ticket_id: str,
    node_name: str,
    action: str,
    policy_citations: Optional[List[str]] = None,
    operational_snapshot: Optional[Dict[str, Any]] = None,
    details: str = "",
) -> None:
    """
    Records an immutable forensic audit trail step for a ticket's resolution.
    """
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT INTO resolution_audit_logs (
                ticket_id, node_name, action, policy_citations, operational_snapshot, details, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id,
            node_name,
            action,
            json.dumps(policy_citations or []),
            json.dumps(operational_snapshot or {}),
            details,
            now_iso,
        ))
    conn.close()


def get_ticket(ticket_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single ticket record by ticket ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tickets WHERE ticket_id = ?;", (ticket_id.strip().upper(),))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return None
    return dict(row)


def get_ticket_audit_logs(ticket_id: str) -> List[Dict[str, Any]]:
    """Retrieves audit trail steps for a given ticket ordered chronologically."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM resolution_audit_logs WHERE ticket_id = ? ORDER BY id ASC;",
        (ticket_id.strip().upper(),),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_tickets(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieves recent tickets ordered by updated_at descending."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM tickets ORDER BY updated_at DESC LIMIT ? OFFSET ?;",
        (limit, offset),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_supervisor_alert(alert: Dict[str, Any]) -> None:
    """Inserts an asynchronous supervisor alert record into SQLite."""
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO supervisor_alerts (
                alert_id, ticket_id, order_id, customer_id, channel,
                severity, title, message, status, payload, dispatched_at
            ) VALUES (
                :alert_id, :ticket_id, :order_id, :customer_id, :channel,
                :severity, :title, :message, :status, :payload, :dispatched_at
            )
        """, {
            "alert_id": alert.get("alert_id"),
            "ticket_id": alert.get("ticket_id"),
            "order_id": alert.get("order_id"),
            "customer_id": alert.get("customer_id"),
            "channel": alert.get("channel", "slack:#support-escalations"),
            "severity": alert.get("severity", "MEDIUM"),
            "title": alert.get("title", "Supervisor Review Required"),
            "message": alert.get("message", ""),
            "status": alert.get("status", "DELIVERED"),
            "payload": alert.get("payload", "{}"),
            "dispatched_at": alert.get("dispatched_at", now_iso),
        })
    conn.close()


def list_supervisor_alerts(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent supervisor alerts in reverse chronological order."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM supervisor_alerts ORDER BY dispatched_at DESC LIMIT ?;",
        (limit,),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_pending_reviews(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves tickets requiring human supervisor review."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM tickets 
        WHERE requires_human_review = 1 
        ORDER BY updated_at DESC LIMIT ?;
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_ticket_review_status(
    ticket_id: str,
    status: str,
    decision: str,
    summary: str,
) -> None:
    """Updates a ticket's status and decision following supervisor review."""
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    with conn:
        conn.execute("""
            UPDATE tickets 
            SET status = ?, decision = ?, summary = ?, requires_human_review = 0, updated_at = ?
            WHERE ticket_id = ?;
        """, (status, decision, summary, now_iso, ticket_id.strip().upper()))
    conn.close()
