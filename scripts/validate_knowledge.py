"""
Knowledge Base & Operational Data Validation Script for AutoResolve AI.

Verifies:
- File existence across knowledge/ and data/
- Markdown YAML frontmatter and document metadata integrity
- Document ID uniqueness and authority tiers
- JSON parsing and schema validation
- Referential integrity (customers, orders, payments, refunds, tickets)
- Ticket expected outcomes and policy guardrails
"""

import json
import os
import sys
import yaml

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
KNOWLEDGE_DIR = os.path.join(BASE_DIR, "knowledge")
DATA_DIR = os.path.join(BASE_DIR, "data")

EXPECTED_POLICIES = [
    "refund_policy.md",
    "payment_policy.md",
    "shipping_policy.md",
    "cancellation_policy.md",
    "account_policy.md",
    "password_security_policy.md",
    "damaged_or_defective_product_policy.md",
    "dispute_and_chargeback_policy.md"
]

EXPECTED_FAQS = [
    "refunds.md",
    "payments.md",
    "shipping.md",
    "cancellations.md",
    "accounts.md",
    "passwords.md",
    "damaged_products.md",
    "chargebacks.md"
]

EXPECTED_RUNBOOKS = [
    "payment_failure.md",
    "duplicate_payment.md",
    "refund_processing.md",
    "delayed_shipment.md",
    "delivered_but_not_received.md",
    "account_locked.md",
    "password_reset.md",
    "damaged_product.md"
]


def parse_frontmatter(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("---"):
        return None, "Missing frontmatter delimiter '---' at start of file"

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, "Incomplete frontmatter block"

    fm_text = parts[1].strip()
    try:
        data = yaml.safe_load(fm_text)
        return data, None
    except Exception as e:
        return None, f"YAML parsing error: {e}"


def validate():
    errors = []
    doc_ids = set()

    # 1. Check policies
    policy_count = 0
    for p_name in EXPECTED_POLICIES:
        p_path = os.path.join(KNOWLEDGE_DIR, "policies", p_name)
        if not os.path.exists(p_path):
            errors.append(f"Missing policy: {p_name}")
            continue
        fm, err = parse_frontmatter(p_path)
        if err:
            errors.append(f"Policy {p_name} error: {err}")
            continue
        
        # Verify required frontmatter fields
        for field in ["document_id", "document_type", "domain", "version", "authority", "last_updated"]:
            if field not in fm:
                errors.append(f"Policy {p_name} missing frontmatter field: {field}")
        
        doc_id = fm.get("document_id")
        if doc_id in doc_ids:
            errors.append(f"Duplicate document_id found: {doc_id} in {p_name}")
        doc_ids.add(doc_id)

        if fm.get("authority") != "authoritative":
            errors.append(f"Policy {p_name} has invalid authority '{fm.get('authority')}'; expected 'authoritative'")
        if fm.get("document_type") != "policy":
            errors.append(f"Policy {p_name} has invalid document_type '{fm.get('document_type')}'")
        policy_count += 1

    # 2. Check FAQs
    faq_count = 0
    for f_name in EXPECTED_FAQS:
        f_path = os.path.join(KNOWLEDGE_DIR, "faqs", f_name)
        if not os.path.exists(f_path):
            errors.append(f"Missing FAQ: {f_name}")
            continue
        fm, err = parse_frontmatter(f_path)
        if err:
            errors.append(f"FAQ {f_name} error: {err}")
            continue
        
        for field in ["document_id", "document_type", "domain", "version", "authority", "last_updated"]:
            if field not in fm:
                errors.append(f"FAQ {f_name} missing frontmatter field: {field}")

        doc_id = fm.get("document_id")
        if doc_id in doc_ids:
            errors.append(f"Duplicate document_id found: {doc_id} in {f_name}")
        doc_ids.add(doc_id)

        if fm.get("authority") != "explanatory":
            errors.append(f"FAQ {f_name} has invalid authority '{fm.get('authority')}'; expected 'explanatory'")
        if fm.get("document_type") != "faq":
            errors.append(f"FAQ {f_name} has invalid document_type '{fm.get('document_type')}'")
        faq_count += 1

    # 3. Check Runbooks
    runbook_count = 0
    for r_name in EXPECTED_RUNBOOKS:
        r_path = os.path.join(KNOWLEDGE_DIR, "runbooks", r_name)
        if not os.path.exists(r_path):
            errors.append(f"Missing Runbook: {r_name}")
            continue
        fm, err = parse_frontmatter(r_path)
        if err:
            errors.append(f"Runbook {r_name} error: {err}")
            continue
        
        for field in ["document_id", "document_type", "domain", "version", "authority", "last_updated"]:
            if field not in fm:
                errors.append(f"Runbook {r_name} missing frontmatter field: {field}")

        doc_id = fm.get("document_id")
        if doc_id in doc_ids:
            errors.append(f"Duplicate document_id found: {doc_id} in {r_name}")
        doc_ids.add(doc_id)

        if fm.get("authority") != "operational":
            errors.append(f"Runbook {r_name} has invalid authority '{fm.get('authority')}'; expected 'operational'")
        if fm.get("document_type") != "runbook":
            errors.append(f"Runbook {r_name} has invalid document_type '{fm.get('document_type')}'")
        runbook_count += 1

    # Check RULES.md and CONSISTENCY_REPORT.md
    for doc in ["RULES.md", "CONSISTENCY_REPORT.md"]:
        if not os.path.exists(os.path.join(KNOWLEDGE_DIR, doc)):
            errors.append(f"Missing required documentation: knowledge/{doc}")

    # 4. Check JSON Datasets
    # Customers
    customers_path = os.path.join(DATA_DIR, "customers", "customers.json")
    if not os.path.exists(customers_path):
        errors.append("Missing data/customers/customers.json")
        return False
    with open(customers_path, "r", encoding="utf-8") as f:
        customers = json.load(f)
    
    customer_ids = set()
    for c in customers:
        for req in ["customer_id", "name", "email", "account_status"]:
            if req not in c:
                errors.append(f"Customer {c.get('customer_id')} missing field: {req}")
        cid = c["customer_id"]
        if cid in customer_ids:
            errors.append(f"Duplicate customer_id: {cid}")
        customer_ids.add(cid)

    # Orders
    orders_path = os.path.join(DATA_DIR, "orders", "orders.json")
    if not os.path.exists(orders_path):
        errors.append("Missing data/orders/orders.json")
        return False
    with open(orders_path, "r", encoding="utf-8") as f:
        orders = json.load(f)

    order_ids = set()
    order_map = {}
    for o in orders:
        for req in ["order_id", "customer_id", "order_date", "amount", "currency", "status", "payment_id", "shipping_status", "product_category", "refundable"]:
            if req not in o:
                errors.append(f"Order {o.get('order_id')} missing field: {req}")
        oid = o["order_id"]
        if oid in order_ids:
            errors.append(f"Duplicate order_id: {oid}")
        order_ids.add(oid)
        order_map[oid] = o

        # FK check
        if o["customer_id"] not in customer_ids:
            errors.append(f"Order {oid} references non-existent customer: {o['customer_id']}")

    # Payments
    payments_path = os.path.join(DATA_DIR, "payments", "payments.json")
    if not os.path.exists(payments_path):
        errors.append("Missing data/payments/payments.json")
        return False
    with open(payments_path, "r", encoding="utf-8") as f:
        payments = json.load(f)

    payment_ids = set()
    for p in payments:
        for req in ["payment_id", "order_id", "customer_id", "amount", "status", "payment_method_type", "created_at"]:
            if req not in p:
                errors.append(f"Payment {p.get('payment_id')} missing field: {req}")
        pid = p["payment_id"]
        if pid in payment_ids:
            errors.append(f"Duplicate payment_id: {pid}")
        payment_ids.add(pid)

        # FK check
        if p["order_id"] not in order_ids:
            errors.append(f"Payment {pid} references non-existent order: {p['order_id']}")
        if p["customer_id"] not in customer_ids:
            errors.append(f"Payment {pid} references non-existent customer: {p['customer_id']}")

    # Refunds
    refunds_path = os.path.join(DATA_DIR, "refunds", "refunds.json")
    if not os.path.exists(refunds_path):
        errors.append("Missing data/refunds/refunds.json")
        return False
    with open(refunds_path, "r", encoding="utf-8") as f:
        refunds = json.load(f)

    refund_ids = set()
    for r in refunds:
        for req in ["refund_id", "order_id", "customer_id", "amount", "status", "reason", "requested_at"]:
            if req not in r:
                errors.append(f"Refund {r.get('refund_id')} missing field: {req}")
        rid = r["refund_id"]
        if rid in refund_ids:
            errors.append(f"Duplicate refund_id: {rid}")
        refund_ids.add(rid)

        # FK check
        if r["order_id"] not in order_ids:
            errors.append(f"Refund {rid} references non-existent order: {r['order_id']}")
        if r["customer_id"] not in customer_ids:
            errors.append(f"Refund {rid} references non-existent customer: {r['customer_id']}")

    # Tickets
    tickets_path = os.path.join(DATA_DIR, "tickets", "tickets.json")
    if not os.path.exists(tickets_path):
        errors.append("Missing data/tickets/tickets.json")
        return False
    with open(tickets_path, "r", encoding="utf-8") as f:
        tickets = json.load(f)

    ticket_ids = set()
    for t in tickets:
        for req in ["ticket_id", "customer_id", "category", "priority", "subject", "message", "expected_resolution", "expected_action", "should_escalate"]:
            if req not in t:
                errors.append(f"Ticket {t.get('ticket_id')} missing field: {req}")
        tid = t["ticket_id"]
        if tid in ticket_ids:
            errors.append(f"Duplicate ticket_id: {tid}")
        ticket_ids.add(tid)

        # FK check
        if t["customer_id"] not in customer_ids:
            errors.append(f"Ticket {tid} references non-existent customer: {t['customer_id']}")

    # Adversarial Tickets
    adv_path = os.path.join(DATA_DIR, "tickets", "adversarial_tickets.json")
    if not os.path.exists(adv_path):
        errors.append("Missing data/tickets/adversarial_tickets.json")
        return False
    with open(adv_path, "r", encoding="utf-8") as f:
        adv_tickets = json.load(f)

    adv_ids = set()
    for a in adv_tickets:
        for req in ["ticket_id", "message", "attack_type", "expected_guard_action"]:
            if req not in a:
                errors.append(f"Adversarial ticket {a.get('ticket_id')} missing field: {req}")
        aid = a["ticket_id"]
        if aid in adv_ids:
            errors.append(f"Duplicate ticket_id in adversarial tickets: {aid}")
        adv_ids.add(aid)

    # Print summary
    print("\nKnowledge Base Validation")
    print("-------------------------")
    print(f"Policies: {policy_count}")
    print(f"FAQs: {faq_count}")
    print(f"Runbooks: {runbook_count}")
    print(f"Customers: {len(customers)}")
    print(f"Orders: {len(orders)}")
    print(f"Payments: {len(payments)}")
    print(f"Refunds: {len(refunds)}")
    print(f"Tickets: {len(tickets)}")
    print(f"Adversarial Tickets: {len(adv_tickets)}")
    print("")

    if errors:
        print("VALIDATION FAILED with errors:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("Validation: PASSED\n")
        return True


if __name__ == "__main__":
    success = validate()
    if not success:
        sys.exit(1)
