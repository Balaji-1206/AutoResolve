# Automated Action Execution Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform AutoResolve AI from a read-only advisor into an autonomous execution system by adding write endpoints (`execute refund`, `update order status`, `generate shipping label`), a two-phase resolution workflow (Investigation -> Automated Execution), and real-time database state mutations.

**Architecture:** 
- `tool-service` exposes write endpoints backed by SQLite mutations in `data/autoresolve.db` (`refunds`, `orders`, `return_shipments`).
- `tool_client.py` provides async client interfaces for mutation endpoints.
- `resolution-service` executes Phase 2 (Action Execution) when an inquiry is determined `ELIGIBLE` and does not require human supervisor review.
- `CustomerPortalTab.tsx` and `ReturnShippingLabelModal.tsx` display real gateway transaction IDs and live carrier tracking numbers.

**Tech Stack:** Python 3.10+, FastAPI, SQLite3 (WAL mode), LangGraph, Next.js 14, Pydantic v2.

**Spec:** [MVP_Readiness_and_Gap_Analysis.md](file:///C:/Users/Sandhiya%20P/.gemini/antigravity/brain/5e8f639d-8733-4cfe-a00f-b346200b30ea/MVP_Readiness_and_Gap_Analysis.md)

## Global Constraints
- Database location: `data/autoresolve.db`.
- Two-phase execution: Actions execute ONLY when `decision == ELIGIBLE` and `requires_human_review == False`. High-value or policy violations (> $500) remain pending.
- Gateway simulation: Generates realistic idempotent transaction IDs (e.g. `tx_mock_xxxxxxxx`).
- Schema updates: Create `return_shipments` table in `data/autoresolve.db`.
- Clean Code principles (single responsibility, explicit schemas, typed Pydantic models).

---

### Task 1: Create `return_shipments` Schema & Action Models in `tool-service`

**Files:**
- Modify: `scripts/init_database.py`
- Modify: `services/tool-service/app/models/tool.py`
- Test: `tests/test_action_schemas.py`

**Interfaces:**
- Produces: `return_shipments` table in SQLite, `RefundExecutionRequest`, `RefundExecutionResponse`, `OrderStatusUpdateRequest`, `ShippingLabelRequest`, `ShippingLabelResponse`.

- [ ] **Step 1: Write test for new schemas and models**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Add `return_shipments` table to `scripts/init_database.py` and action models to `app/models/tool.py`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Run `scripts/init_database.py` on live DB**

---

### Task 2: Implement Action Tools & API Endpoints in `tool-service`

**Files:**
- Create: `services/tool-service/app/tools/actions.py`
- Modify: `services/tool-service/app/api/tools.py`
- Test: `tests/test_tool_actions.py`

**Interfaces:**
- Produces:
  - `POST /api/v1/tools/refunds/execute`
  - `POST /api/v1/tools/orders/{order_id}/update-status`
  - `POST /api/v1/tools/shipping/generate-label`

- [ ] **Step 1: Write test for action tools**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `app/tools/actions.py` and router handlers in `app/api/tools.py`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 3: Integrate Two-Phase Execution in `resolution-service`

**Files:**
- Modify: `services/resolution-service/app/clients/tool_client.py`
- Modify: `services/resolution-service/app/workflows/graph.py`
- Modify: `services/resolution-service/app/workflows/investigation.py`
- Test: `tests/test_resolution_action_execution.py`

**Interfaces:**
- Consumes: Tool Service mutation endpoints
- Produces: Two-phase resolution where `actions_taken` contains executed refund details, tracking number, and updated order status.

- [ ] **Step 1: Write test for automated action execution in resolution workflow**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Add client mutation methods to `tool_client.py` and action execution node/step in `investigation.py` and `graph.py`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 4: Connect Frontend to Real Action Outcomes

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/components/tabs/CustomerPortalTab.tsx`
- Modify: `frontend/src/components/ReturnShippingLabelModal.tsx`

**Interfaces:**
- Displays real gateway transaction ID, updated order status (`REFUNDED` / `RETURN_INITIATED`), and dynamic carrier tracking number.

- [ ] **Step 1: Update `ReturnShippingLabelModal.tsx` to accept dynamic tracking number and carrier**
- [ ] **Step 2: Update `CustomerPortalTab.tsx` to surface executed transaction details**
- [ ] **Step 3: Verify frontend build (`npm run build`)**

---

### Task 5: End-to-End System Verification

- [ ] **Step 1: Restart `tool-service` and `resolution-service`**
- [ ] **Step 2: Submit an eligible ticket (`ORD-1001`)**
- [ ] **Step 3: Verify database state mutations: order status is `REFUNDED`, refund record exists with gateway transaction ID, and return shipment record exists in SQLite**
