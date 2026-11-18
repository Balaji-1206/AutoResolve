"""
Unit tests for database initialization, schema creation, and JSON data seeding.
"""

import os
import sqlite3
import tempfile
import pytest

from scripts.init_database import create_tables, seed_from_json, init_database


@pytest.fixture
def temp_db_path():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_create_tables(temp_db_path):
    conn = sqlite3.connect(temp_db_path)
    create_tables(conn)

    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = {row[0] for row in cursor.fetchall()}

    expected_tables = {
        "customers",
        "orders",
        "payments",
        "refunds",
        "tickets",
        "resolution_audit_logs",
    }
    assert expected_tables.issubset(tables), f"Missing tables: {expected_tables - tables}"
    conn.close()


def test_seed_from_json(temp_db_path):
    conn = sqlite3.connect(temp_db_path)
    create_tables(conn)
    seed_from_json(conn)

    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM customers;")
    customer_count = cursor.fetchone()[0]
    assert customer_count > 0, "Customers table should have seeded rows"

    cursor.execute("SELECT COUNT(*) FROM orders;")
    order_count = cursor.fetchone()[0]
    assert order_count > 0, "Orders table should have seeded rows"

    cursor.execute("SELECT COUNT(*) FROM payments;")
    payment_count = cursor.fetchone()[0]
    assert payment_count > 0, "Payments table should have seeded rows"

    conn.close()
