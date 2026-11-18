"""
Action Execution Tools for AutoResolve AI.

Performs authoritative state mutations against operational datasets:
- Executing payment gateway refunds and updating refund records
- Updating order lifecycle statuses
- Generating return shipping labels with tracking numbers
"""

from datetime import datetime
import logging
import random
import time
from typing import Optional

from app.database import get_db_connection
from app.models.tool import (
    OrderResponse,
    RefundExecutionResponse,
    ShippingLabelResponse,
)
from app.tools.orders import get_order

logger = logging.getLogger("autoresolve.tool.actions")


def execute_refund_action(
    order_id: str,
    customer_id: str,
    amount: float,
    reason: str,
    refund_id: Optional[str] = None,
    payment_method: str = "ORIGINAL_PAYMENT_METHOD",
) -> RefundExecutionResponse:
    """
    Executes a simulated payment gateway refund transaction and updates
    both the refund records and order lifecycle state in SQLite.
    """
    clean_order_id = order_id.strip().upper()
    clean_customer_id = customer_id.strip().upper()

    # 1. Validate order exists
    order = get_order(clean_order_id)

    # 2. Allocate identifiers
    target_refund_id = (
        refund_id.strip().upper()
        if refund_id
        else f"REF-{random.randint(1000, 9999)}"
    )
    mock_tx_id = f"tx_mock_{int(time.time() * 1000)}_{random.randint(100, 999)}"
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    with conn:
        # 3. Insert or update refund record
        conn.execute("""
            INSERT OR REPLACE INTO refunds (
                refund_id, order_id, customer_id, amount, status, reason,
                requested_at, approved_at, processed_at
            ) VALUES (?, ?, ?, ?, 'PROCESSED', ?, ?, ?, ?)
        """, (
            target_refund_id,
            clean_order_id,
            clean_customer_id,
            amount,
            reason,
            now_iso,
            now_iso,
            now_iso,
        ))

        # 4. Mutate order status to REFUNDED
        conn.execute("""
            UPDATE orders SET status = 'REFUNDED' WHERE order_id = ?;
        """, (clean_order_id,))

    conn.close()

    logger.info(
        "Refund executed: order=%s refund_id=%s amount=%.2f tx=%s",
        clean_order_id,
        target_refund_id,
        amount,
        mock_tx_id,
    )

    return RefundExecutionResponse(
        refund_id=target_refund_id,
        order_id=clean_order_id,
        customer_id=clean_customer_id,
        amount=amount,
        status="PROCESSED",
        gateway_transaction_id=mock_tx_id,
        processed_at=now_iso,
        message=f"Refund of ${amount:.2f} successfully executed to {payment_method}.",
    )


def update_order_status_action(
    order_id: str,
    new_status: str,
    reason: Optional[str] = None,
) -> OrderResponse:
    """
    Mutates an order's lifecycle status in SQLite and returns the updated order record.
    """
    clean_order_id = order_id.strip().upper()
    clean_status = new_status.strip().upper()

    conn = get_db_connection()
    with conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE orders SET status = ? WHERE order_id = ?;
        """, (clean_status, clean_order_id))
        if cursor.rowcount == 0:
            conn.close()
            from app.tools.orders import OrderNotFoundError
            raise OrderNotFoundError(f"Order '{clean_order_id}' not found.")
    conn.close()

    logger.info("Order %s status updated to %s (reason: %s)", clean_order_id, clean_status, reason)
    return get_order(clean_order_id)


def generate_shipping_label_action(
    order_id: str,
    customer_id: str,
    carrier: str = "UPS Ground",
) -> ShippingLabelResponse:
    """
    Generates a pre-paid return shipment record and assigns an authoritative carrier tracking number.
    """
    clean_order_id = order_id.strip().upper()
    clean_customer_id = customer_id.strip().upper()

    shipment_id = f"SHP-{random.randint(1000, 9999)}"
    # Realistic UPS Ground tracking number: 1Z + 6 chars + 2 digits + 8 digits
    tracking_number = f"1Z999AA10{random.randint(10000000, 99999999)}"
    label_url = f"/api/v1/tools/shipping/labels/{shipment_id}.pdf"
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    with conn:
        conn.execute("""
            INSERT OR REPLACE INTO return_shipments (
                shipment_id, order_id, customer_id, carrier, tracking_number, status, label_url, created_at
            ) VALUES (?, ?, ?, ?, ?, 'LABEL_CREATED', ?, ?)
        """, (
            shipment_id,
            clean_order_id,
            clean_customer_id,
            carrier,
            tracking_number,
            label_url,
            now_iso,
        ))
    conn.close()

    logger.info(
        "Return shipping label generated: order=%s shipment_id=%s tracking=%s",
        clean_order_id,
        shipment_id,
        tracking_number,
    )

    return ShippingLabelResponse(
        shipment_id=shipment_id,
        order_id=clean_order_id,
        customer_id=clean_customer_id,
        carrier=carrier,
        tracking_number=tracking_number,
        status="LABEL_CREATED",
        label_url=label_url,
        created_at=now_iso,
    )
