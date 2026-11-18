# Asynchronous HITL Alerting & Separate Admin Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dual-portal architecture with a main gateway (`/`), a pure customer-facing portal (`/customer`) free of internal controls, and a dedicated Apple iOS-styled fluid glassmorphism operations admin portal (`/admin`) with asynchronous human-in-the-loop (HITL) alerting and one-click exception execution.

**Architecture:**
- Main Landing Gateway (`/`): Fluid frosted-glass card selector routing to `/customer` and `/admin`.
- Customer Portal (`/customer`): 100% customer-facing. All supervisor notification bells, modal triggers, and admin links are stripped out.
- Admin Console (`/admin`): Real-time supervisor queue, case inspection drawer, one-click approve/reject actions (triggering Phase 2 execution), and asynchronous alert delivery audit logs.
- Backend Alerting Engine (`resolution-service`): Asynchronous alert dispatcher saving events to `supervisor_alerts` table in `data/autoresolve.db` and dispatching external notifications.
- Admin Review API: Endpoints in `services/resolution-service` for listing reviews, fetching alerts, and applying durable supervisor decisions.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Framer Motion (Apple fluid spring physics), FastAPI, SQLite3 (WAL mode), LangGraph.

**Spec:** [MVP_Readiness_and_Gap_Analysis.md](file:///C:/Users/Sandhiya%20P/.gemini/antigravity/brain/5e8f639d-8733-4cfe-a00f-b346200b30ea/MVP_Readiness_and_Gap_Analysis.md)

## Global Constraints
- Database: `data/autoresolve.db` with WAL mode.
- Style: Apple iOS fluid glassmorphism (backdrop-blur-xl, subtle specular borders, spring micro-interactions).
- Zero customer leakage: Customers on `/customer` must NEVER see supervisor reviews, admin bells, or management approvals.
- High-value protection: Orders > $500 must not execute automated refunds until explicitly approved by an admin in `/admin`.
- Clean Code principles (single responsibility, explicit Pydantic models, typed React components).

---

### Task 1: SQLite Alert Schema & Asynchronous Alert Dispatcher

**Files:**
- Modify: `scripts/init_database.py`
- Modify: `services/resolution-service/app/database.py`
- Create: `services/resolution-service/app/alerts/dispatcher.py`
- Test: `tests/test_hitl_alerting.py`

**Interfaces:**
- Produces: `supervisor_alerts` table in SQLite, `dispatch_hitl_alert(ticket_id, reason, order_id, amount, customer_id)`, `list_supervisor_alerts(limit=50)`.

- [x] **Step 1: Write test for alert persistence and dispatch**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update `scripts/init_database.py` with `supervisor_alerts` table and run it**
- [x] **Step 4: Implement alert DB functions in `services/resolution-service/app/database.py`**
- [x] **Step 5: Implement `services/resolution-service/app/alerts/dispatcher.py`**
- [x] **Step 6: Integrate alert dispatch call into `investigation.py` when `requires_human_review == True`**
- [x] **Step 7: Run test to verify it passes**

---

### Task 2: Backend Admin Review & Decision Endpoints

**Files:**
- Create: `services/resolution-service/app/api/admin.py`
- Modify: `services/resolution-service/app/main.py`
- Test: `tests/test_admin_endpoints.py`

**Interfaces:**
- Produces:
  - `GET /api/v1/resolution/admin/reviews` (list pending supervisor cases)
  - `POST /api/v1/resolution/admin/reviews/{ticket_id}/decision` (apply supervisor decision: approve executes Phase 2 refund/label; reject updates notes)
  - `GET /api/v1/resolution/admin/alerts` (list dispatched asynchronous alerts)

- [x] **Step 1: Write test for admin review endpoints**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement `app/api/admin.py` with review listing, decision processing, and alert retrieval**
- [x] **Step 4: Mount admin router in `app/main.py`**
- [x] **Step 5: Run test to verify it passes**

---

### Task 3: Main Landing Gateway (`/`) with Apple iOS Fluid Glassmorphism

**Files:**
- Create: `frontend/src/app/page.tsx`
- Test: Visual & build test

**Interfaces:**
- Produces: Clean root gateway presenting shoppers and staff with two interactive Apple fluid glassmorphic cards:
  - "Customer Care Portal" -> `/customer`
  - "Operations Admin Console" -> `/admin` (with live badge for pending escalations)

- [x] **Step 1: Implement `/` landing page with Apple iOS fluid aesthetics, mesh gradients, and spring animations**
- [x] **Step 2: Fetch pending review count to show real-time badge on Admin card**

---

### Task 4: Pure Customer Portal (`/customer`)

**Files:**
- Create: `frontend/src/app/customer/page.tsx`
- Modify: `frontend/src/components/Header.tsx` (remove supervisor button on customer portal)
- Modify: `frontend/src/components/tabs/CustomerPortalTab.tsx` (ensure clean escalation message without employee triggers)
- Test: Visual & build test

**Interfaces:**
- Produces: Clean customer-only experience with zero administrative tools. When escalated, shows reassurance card with no supervisor buttons.

- [x] **Step 1: Create `frontend/src/app/customer/page.tsx` hosting customer tabs**
- [x] **Step 2: Clean customer Header and Footer (remove all supervisor modals and triggers)**
- [x] **Step 3: Verify customer experience displays only customer actions**

---

### Task 5: Operations Admin Console (`/admin`)

**Files:**
- Create: `frontend/src/app/admin/page.tsx`
- Modify: `frontend/src/lib/api.ts` (add admin review & alert API client methods)
- Test: Visual & build test

**Interfaces:**
- Produces: Full supervisor operations console with:
  - Pending Review Queue with real-time SQLite data
  - Case Inspection modal with policy citations and AI reasoning
  - One-click "Approve Exception & Execute" (calls Phase 2 write endpoints) and "Decline"
  - Real-time Asynchronous Alert Dispatch Log (Webhook / Slack delivery status)

- [x] **Step 1: Add admin API methods to `frontend/src/lib/api.ts`**
- [x] **Step 2: Build `frontend/src/app/admin/page.tsx` using Apple iOS fluid glassmorphism**
- [x] **Step 3: Wire approval action to trigger authoritative write execution**

---

### Task 6: End-to-End System Verification

**Files:**
- Run: `frontend` build (`npm run build`)
- Run: Backend test suite (`pytest tests/`)
- Restart all microservice daemons
- Test: Submit high-value ticket ($1,299.99), observe customer reassurance on `/customer`, check alert in `/admin`, approve review in `/admin`, and verify order status mutates to `REFUNDED` in SQLite.

- [x] **Step 1: Run frontend build and backend tests**
- [x] **Step 2: Restart services**
- [x] **Step 3: Verify end-to-end customer escalation -> HITL alert -> admin approval -> action execution**
