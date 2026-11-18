"""
Database initialization and data migration script for AutoResolve AI.

Creates the SQLite relational schema and populates tables from operational JSON files.
"""

from datetime import datetime
import json
import logging
from pathlib import Path
import sqlite3
from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("autoresolve.database")

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = REPO_ROOT / "data" / "autoresolve.db"


def get_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Creates a connection with WAL mode enabled and foreign keys enforced."""
    target_path = db_path or DEFAULT_DB_PATH
    target_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target_path))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def create_tables(conn: sqlite3.Connection) -> None:
    """Creates all core relational tables and indexes."""
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS customers (
            customer_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            account_status TEXT DEFAULT 'ACTIVE',
            billing_zip TEXT,
            phone_last4 TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            order_date TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'USD',
            status TEXT NOT NULL,
            payment_id TEXT,
            shipping_status TEXT,
            product_category TEXT,
            refundable INTEGER DEFAULT 1,
            delivered_at TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        );

        CREATE TABLE IF NOT EXISTS payments (
            payment_id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            payment_method_type TEXT NOT NULL,
            failure_reason TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        );

        CREATE TABLE IF NOT EXISTS refunds (
            refund_id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            amount REAL NOT NULL,
            status TEXT NOT NULL,
            reason TEXT,
            requested_at TEXT NOT NULL,
            approved_at TEXT,
            processed_at TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        );

        CREATE TABLE IF NOT EXISTS tickets (
            ticket_id TEXT PRIMARY KEY,
            order_id TEXT,
            customer_id TEXT,
            customer_message TEXT NOT NULL,
            decision TEXT NOT NULL,
            status TEXT NOT NULL,
            summary TEXT NOT NULL,
            reasoning_summary TEXT NOT NULL,
            requires_human_review INTEGER DEFAULT 0,
            review_reasons TEXT,
            duration_ms REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS resolution_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT NOT NULL,
            node_name TEXT,
            action TEXT NOT NULL,
            policy_citations TEXT,
            operational_snapshot TEXT,
            details TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (ticket_id) REFERENCES tickets (ticket_id)
        );

        CREATE TABLE IF NOT EXISTS return_shipments (
            shipment_id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            carrier TEXT NOT NULL,
            tracking_number TEXT NOT NULL,
            status TEXT NOT NULL,
            label_url TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        );

        CREATE TABLE IF NOT EXISTS supervisor_alerts (
            alert_id TEXT PRIMARY KEY,
            ticket_id TEXT NOT NULL,
            order_id TEXT,
            customer_id TEXT,
            channel TEXT NOT NULL,
            severity TEXT DEFAULT 'MEDIUM',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'DELIVERED',
            payload TEXT,
            dispatched_at TEXT NOT NULL
        );

        -- Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
        CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
        CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds (order_id);
        CREATE INDEX IF NOT EXISTS idx_shipments_order ON return_shipments (order_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets (order_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets (customer_id);
        CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
        CREATE INDEX IF NOT EXISTS idx_audit_ticket ON resolution_audit_logs (ticket_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_ticket ON supervisor_alerts (ticket_id);
        CREATE INDEX IF NOT EXISTS idx_alerts_status ON supervisor_alerts (status);
        """)
    logger.info("Database schemas and indexes initialized successfully.")


def seed_from_json(conn: sqlite3.Connection, data_dir: Optional[Path] = None) -> None:
    """Reads JSON records from disk and populates SQLite tables idempotently."""
    base_dir = data_dir or (REPO_ROOT / "data")

    # 1. Customers
    customers_file = base_dir / "customers" / "customers.json"
    if not customers_file.is_file():
        customers_file = base_dir / "customers.json"
    if customers_file.is_file():
        with open(customers_file, "r", encoding="utf-8") as f:
            customers = json.load(f)
        with conn:
            conn.executemany("""
                INSERT OR REPLACE INTO customers (
                    customer_id, name, email, account_status, billing_zip, phone_last4, created_at
                ) VALUES (
                    :customer_id, :name, :email, :account_status, :billing_zip, :phone_last4, :created_at
                )
            """, customers)
        logger.info("Seeded %d customers.", len(customers))

    # 2. Orders
    orders_file = base_dir / "orders" / "orders.json"
    if not orders_file.is_file():
        orders_file = base_dir / "orders.json"
    if orders_file.is_file():
        with open(orders_file, "r", encoding="utf-8") as f:
            orders = json.load(f)

        # Ensure all referenced customers exist to uphold relational integrity
        cursor = conn.cursor()
        cursor.execute("SELECT customer_id FROM customers;")
        existing_customers = {row[0] for row in cursor.fetchall()}
        missing_customers = {o["customer_id"] for o in orders if o.get("customer_id") not in existing_customers}
        
        for missing_cid in missing_customers:
            with conn:
                conn.execute("""
                    INSERT OR IGNORE INTO customers (
                        customer_id, name, email, account_status, billing_zip, phone_last4, created_at
                    ) VALUES (?, ?, ?, 'ACTIVE', '00000', '0000', datetime('now'))
                """, (missing_cid, f"Account ({missing_cid})", f"{missing_cid.lower()}@autoresolve.internal"))
            logger.info("Auto-registered placeholder for missing customer reference: %s", missing_cid)

        # Ensure refundable is integer
        for o in orders:
            o["refundable"] = 1 if o.get("refundable", True) else 0
        with conn:
            conn.executemany("""
                INSERT OR REPLACE INTO orders (
                    order_id, customer_id, order_date, amount, currency, status,
                    payment_id, shipping_status, product_category, refundable, delivered_at
                ) VALUES (
                    :order_id, :customer_id, :order_date, :amount, :currency, :status,
                    :payment_id, :shipping_status, :product_category, :refundable, :delivered_at
                )
            """, orders)
        logger.info("Seeded %d orders.", len(orders))

    # 3. Payments
    payments_file = base_dir / "payments" / "payments.json"
    if not payments_file.is_file():
        payments_file = base_dir / "payments.json"
    if payments_file.is_file():
        with open(payments_file, "r", encoding="utf-8") as f:
            payments = json.load(f)
        with conn:
            conn.executemany("""
                INSERT OR REPLACE INTO payments (
                    payment_id, order_id, customer_id, amount, status,
                    payment_method_type, failure_reason, created_at
                ) VALUES (
                    :payment_id, :order_id, :customer_id, :amount, :status,
                    :payment_method_type, :failure_reason, :created_at
                )
            """, payments)
        logger.info("Seeded %d payments.", len(payments))

    # 4. Refunds
    refunds_file = base_dir / "refunds" / "refunds.json"
    if not refunds_file.is_file():
        refunds_file = base_dir / "refunds.json"
    if refunds_file.is_file():
        with open(refunds_file, "r", encoding="utf-8") as f:
            refunds = json.load(f)
        with conn:
            conn.executemany("""
                INSERT OR REPLACE INTO refunds (
                    refund_id, order_id, customer_id, amount, status,
                    reason, requested_at, approved_at, processed_at
                ) VALUES (
                    :refund_id, :order_id, :customer_id, :amount, :status,
                    :reason, :requested_at, :approved_at, :processed_at
                )
            """, refunds)
        logger.info("Seeded %d refunds.", len(refunds))


def init_database(db_path: Optional[Path] = None) -> None:
    """Convenience entrypoint to prepare and seed database."""
    conn = get_connection(db_path)
    create_tables(conn)
    seed_from_json(conn)
    conn.close()
    logger.info("Database initialization complete.")


if __name__ == "__main__":
    init_database()
