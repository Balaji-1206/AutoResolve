# Database Persistence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static JSON file storage and ephemeral browser state with an ACID-compliant SQLite relational database layer, durable LangGraph state checkpointing (`AsyncSqliteSaver`), and persistent ticket inquiry APIs.

**Architecture:** A shared SQLite database (`data/autoresolve.db`) operating with Write-Ahead Logging (`WAL`) mode and foreign key enforcement holds `customers`, `orders`, `payments`, `refunds`, `tickets`, and `resolution_audit_logs`. `tool-service` queries relational tables with indexes, while `resolution-service` persists ticket lifecycles and uses `AsyncSqliteSaver` to preserve multi-turn agent state across server restarts.

**Tech Stack:** Python 3.10+, SQLite3 (standard library), `aiosqlite`, `langgraph-checkpoint-sqlite` (3.1.3), FastAPI, Pydantic v2, Next.js 14.

**Spec:** [MVP_Readiness_and_Gap_Analysis.md](file:///C:/Users/Sandhiya%20P/.gemini/antigravity/brain/5e8f639d-8733-4cfe-a00f-b346200b30ea/MVP_Readiness_and_Gap_Analysis.md)

## Global Constraints
- Database location: `data/autoresolve.db` (auto-created if missing).
- LangGraph Checkpoints database: `data/checkpoints.db`.
- WAL mode enabled: `PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`.
- Strict backward compatibility: Fallback gracefully to JSON loader if database is empty before seed.
- Clean Code: Robert Martin's Clean Code principles (single responsibility, explicit error types, descriptive names).
- Fast synchronous/asynchronous execution with bounded timeouts.

---

### Task 1: SQLite Schema Definition & Database Initialization Script

**Files:**
- Create: `scripts/init_database.py`
- Create: `tests/test_database_init.py`

**Interfaces:**
- Consumes: `data/orders/orders.json`, `data/customers/customers.json`, `data/payments/payments.json`, `data/refunds/refunds.json`
- Produces: `data/autoresolve.db` containing seeded tables `customers`, `orders`, `payments`, `refunds`, `tickets`, `resolution_audit_logs`.

- [ ] **Step 1: Write test for database initialization and schema validation**

Create `tests/test_database_init.py` validating that running the migration creates all 6 tables with correct primary keys and indexes.

- [ ] **Step 2: Run test to verify it fails**

Run: `.venv\Scripts\pytest tests/test_database_init.py -v`  
Expected: FAIL (script does not exist).

- [ ] **Step 3: Implement `scripts/init_database.py`**

Implement `create_tables()` and `seed_from_json()` with idempotency (`CREATE TABLE IF NOT EXISTS`, `INSERT OR REPLACE`).

- [ ] **Step 4: Run test to verify it passes**

Run: `.venv\Scripts\pytest tests/test_database_init.py -v`  
Expected: PASS.

- [ ] **Step 5: Run init script on live environment**

Run: `.venv\Scripts\python scripts/init_database.py`  
Verify: `data/autoresolve.db` exists with verified row counts.

---

### Task 2: Refactor `tool-service` to Read/Write via SQLite

**Files:**
- Create: `services/tool-service/app/database.py`
- Modify: `services/tool-service/app/tools/orders.py`
- Modify: `services/tool-service/app/tools/customer.py`
- Modify: `services/tool-service/app/tools/payments.py`
- Modify: `services/tool-service/app/tools/refunds.py`
- Modify: `services/tool-service/app/api/tools.py`
- Test: `tests/test_tool_service_db.py`

**Interfaces:**
- Consumes: `data/autoresolve.db`
- Produces: SQLite-backed lookups (`get_order`, `get_customer`, `get_payment`, `get_refund`, `list_orders`), plus mutation function `create_or_update_refund()`.

- [ ] **Step 1: Write test for tool-service database functions**

Create `tests/test_tool_service_db.py` checking order retrieval, customer retrieval, payment retrieval, and refund persistence against SQLite.

- [ ] **Step 2: Run test to verify it fails**

Run: `.venv\Scripts\pytest tests/test_tool_service_db.py -v`  
Expected: FAIL.

- [ ] **Step 3: Implement `services/tool-service/app/database.py` and tool adapters**

Create helper functions in `database.py` with thread-safe SQLite connections. Update tool functions to query database records while maintaining exact Pydantic model response signatures.

- [ ] **Step 4: Run test to verify it passes**

Run: `.venv\Scripts\pytest tests/test_tool_service_db.py -v`  
Expected: PASS.

---

### Task 3: Implement Ticket Persistence & LangGraph Checkpointer in `resolution-service`

**Files:**
- Create: `services/resolution-service/app/database.py`
- Modify: `services/resolution-service/app/workflows/graph.py`
- Modify: `services/resolution-service/app/workflows/investigation.py`
- Modify: `services/resolution-service/app/api/resolution.py`
- Modify: `services/resolution-service/app/main.py`
- Test: `tests/test_resolution_persistence.py`

**Interfaces:**
- Consumes: `InvestigationResponse`, `data/autoresolve.db`, `data/checkpoints.db`
- Produces: `save_ticket_investigation()`, `list_tickets()`, `get_ticket_by_id()`, `GET /api/v1/resolution/tickets`, `GET /api/v1/resolution/tickets/{ticket_id}`.

- [ ] **Step 1: Write test for ticket persistence and retrieval API**

Create `tests/test_resolution_persistence.py` verifying that investigating a ticket saves it to SQLite and can be retrieved by ID via FastAPI test client.

- [ ] **Step 2: Run test to verify it fails**

Run: `.venv\Scripts\pytest tests/test_resolution_persistence.py -v`  
Expected: FAIL.

- [ ] **Step 3: Implement database repository and endpoints in `resolution-service`**

Implement `save_ticket_investigation()`, configure `AsyncSqliteSaver.from_conn_string("data/checkpoints.db")` in lifespan, and add `GET /tickets` and `GET /tickets/{ticket_id}` routes.

- [ ] **Step 4: Run test to verify it passes**

Run: `.venv\Scripts\pytest tests/test_resolution_persistence.py -v`  
Expected: PASS.

---

### Task 4: Connect Frontend to Persistent Ticket History

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/types.ts`
- Modify: `frontend/src/components/tabs/CustomerPortalTab.tsx`
- Modify: `frontend/src/app/page.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/resolution/tickets`, `GET /api/v1/resolution/tickets/{ticket_id}`
- Produces: Persistent ticket cards in customer portal that remain after browser page refresh.

- [ ] **Step 1: Add typed client functions in `frontend/src/lib/api.ts`**

Implement `fetchSavedTickets()` and `fetchTicketById(id)`.

- [ ] **Step 2: Update Customer UI to show saved resolution history**

Add a "Recent Inquiries & Saved Resolutions" section to `CustomerPortalTab.tsx` loading tickets from the database on mount.

- [ ] **Step 3: Verify frontend build**

Run: `npm --prefix frontend run build`  
Expected: Build succeeds with 0 TypeScript errors.

---

### Task 5: End-to-End System Verification & Service Restarts

**Files:**
- Run daemons: `rag-service` (8000), `tool-service` (8001), `resolution-service` (8002), `frontend` (3000).

- [ ] **Step 1: Start all 4 daemons**
- [ ] **Step 2: Submit a test ticket and verify database storage**
- [ ] **Step 3: Restart services and query ticket by ID to verify 100% persistence across reboots**
