"""
End-to-End Test and Demonstration Script for AutoResolve Tool Service Microservice.

Tests:
1. Health Check & Service Identity
2. Order Tool: GET /api/v1/tools/orders/ORD-0001 & ORD-1001
3. Customer Tool: GET /api/v1/tools/customers/CUS-1001
4. Payment Tool: GET /api/v1/tools/payments/PAY-1001
5. Refund Tool: GET /api/v1/tools/refunds/REF-1001
6. Error Handling: 404 (Missing records) & 400 (Malformed IDs)
"""

import json
import sys
import time
from pathlib import Path

# Add tool-service to sys.path
repo_root = Path(__file__).resolve().parent.parent
tool_service_path = repo_root / "services" / "tool-service"
sys.path.insert(0, str(tool_service_path))

from fastapi.testclient import TestClient
from app.main import app


def format_header(title: str):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)


def run_demo():
    print("\n" + "#" * 70)
    print("  AUTORESOLVE AI - TOOL SERVICE MICROSERVICE DEMO & TEST")
    print("#" * 70)

    client = TestClient(app)

    # 1. Health Probe
    format_header("1. Health Check (GET /health)")
    resp = client.get("/health")
    print(f"Status Code: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200

    # 2. Order Investigation
    format_header("2. Order Tool (GET /api/v1/tools/orders/ORD-1001)")
    t0 = time.time()
    resp = client.get("/api/v1/tools/orders/ORD-1001")
    dt = (time.time() - t0) * 1000
    print(f"Status Code: {resp.status_code} (Latency: {dt:.2f}ms)")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200
    assert resp.json()["order_id"] == "ORD-1001"

    # 3. Customer Investigation
    format_header("3. Customer Tool (GET /api/v1/tools/customers/CUS-1001)")
    t0 = time.time()
    resp = client.get("/api/v1/tools/customers/CUS-1001")
    dt = (time.time() - t0) * 1000
    print(f"Status Code: {resp.status_code} (Latency: {dt:.2f}ms)")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200
    assert resp.json()["customer_id"] == "CUS-1001"
    assert resp.json()["name"] == "Aarav Kumar"

    # 4. Payment Investigation
    format_header("4. Payment Tool (GET /api/v1/tools/payments/PAY-1001)")
    t0 = time.time()
    resp = client.get("/api/v1/tools/payments/PAY-1001")
    dt = (time.time() - t0) * 1000
    print(f"Status Code: {resp.status_code} (Latency: {dt:.2f}ms)")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200
    assert resp.json()["payment_id"] == "PAY-1001"
    assert resp.json()["amount"] == 120.0
    assert resp.json()["status"] == "SUCCESS"

    # 5. Refund Investigation
    format_header("5. Refund Tool (GET /api/v1/tools/refunds/REF-1001)")
    t0 = time.time()
    resp = client.get("/api/v1/tools/refunds/REF-1001")
    dt = (time.time() - t0) * 1000
    print(f"Status Code: {resp.status_code} (Latency: {dt:.2f}ms)")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 200
    assert resp.json()["refund_id"] == "REF-1001"
    assert resp.json()["status"] == "COMPLETED"

    # 6. Error Handling - 404 Not Found
    format_header("6. Error Handling: Missing Entity (GET /api/v1/tools/orders/ORD-9999)")
    resp = client.get("/api/v1/tools/orders/ORD-9999")
    print(f"Status Code: {resp.status_code} (Expected 404)")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 404

    # 7. Error Handling - 400 Bad Request
    format_header("7. Error Handling: Malformed Identifier (GET /api/v1/tools/customers/INVALID)")
    resp = client.get("/api/v1/tools/customers/INVALID")
    print(f"Status Code: {resp.status_code} (Expected 400)")
    print(json.dumps(resp.json(), indent=2))
    assert resp.status_code == 400

    print("\n" + "=" * 70)
    print(" ALL 4 OPERATIONAL TOOLS (ORDER, CUSTOMER, PAYMENT, REFUND) VERIFIED!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_demo()
