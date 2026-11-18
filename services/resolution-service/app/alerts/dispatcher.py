"""
Asynchronous Human-in-the-Loop (HITL) Alert Dispatcher.

Handles non-blocking asynchronous escalation notifications to store supervisors
via external channels (e.g. simulated Slack / Webhook / Email), recording immutable
delivery receipts in SQLite (`data/autoresolve.db`).
"""

from datetime import datetime
import json
import logging
import time
from typing import Any, Dict, Optional
from app.database import save_supervisor_alert

logger = logging.getLogger("autoresolve.resolution.alerts")


async def dispatch_hitl_alert(
    ticket_id: str,
    reason: str,
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    amount: Optional[float] = None,
    severity: Optional[str] = None,
    channel: str = "slack:#support-escalations",
) -> Dict[str, Any]:
    """
    Dispatches an asynchronous notification to internal support supervisors
    and logs the delivery record to the SQLite database.
    """
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    alert_id = f"ALT-{int(time.time() * 1000)}"

    # Compute sensible severity if not specified
    if not severity:
        if amount and amount >= 1000.0:
            severity = "CRITICAL"
        elif amount and amount >= 500.0:
            severity = "HIGH"
        else:
            severity = "MEDIUM"

    title = f"Supervisor Review Required: {ticket_id}"
    if order_id:
        title += f" (Order {order_id})"

    message = (
        f"Ticket {ticket_id} flagged for human review. "
        f"Reason: {reason}. "
        f"{f'Amount: ${amount:.2f}. ' if amount else ''}"
        f"Customer: {customer_id or 'Unknown'}."
    )

    payload = json.dumps({
        "ticket_id": ticket_id,
        "order_id": order_id,
        "customer_id": customer_id,
        "amount": amount,
        "reason": reason,
        "channel": channel,
    })

    alert_record = {
        "alert_id": alert_id,
        "ticket_id": ticket_id,
        "order_id": order_id,
        "customer_id": customer_id,
        "channel": channel,
        "severity": severity,
        "title": title,
        "message": message,
        "status": "DELIVERED",
        "payload": payload,
        "dispatched_at": now_iso,
    }

    try:
        save_supervisor_alert(alert_record)
        logger.info(
            "Dispatched HITL alert %s via %s for ticket %s (Severity: %s)",
            alert_id,
            channel,
            ticket_id,
            severity,
        )
    except Exception as exc:
        logger.error("Failed to persist supervisor alert %s: %s", alert_id, exc)
        alert_record["status"] = "FAILED"

    return {
        "alert_id": alert_id,
        "ticket_id": ticket_id,
        "channel": channel,
        "severity": severity,
        "status": alert_record["status"],
        "dispatched_at": now_iso,
    }
