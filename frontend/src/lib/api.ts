import { InvestigationResult, ServiceHealth, SavedTicket, SavedTicketDetail } from "./types";

const RESOLUTION_URL = process.env.NEXT_PUBLIC_RESOLUTION_URL || "http://localhost:8002";
const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL || "http://localhost:8000";
const TOOL_URL = process.env.NEXT_PUBLIC_TOOL_URL || "http://localhost:8001";

export interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  summary: string;
  fullText: string;
}

export interface LiveOrder {
  order_id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  currency: string;
  order_date: string;
  delivery_date?: string;
  shipping_status?: string;
  product_category?: string;
  payment_id?: string;
  refundable?: boolean;
}

export async function fetchLiveOrders(customerId?: string): Promise<LiveOrder[]> {
  const url = customerId
    ? `${TOOL_URL}/api/v1/tools/orders?customer_id=${encodeURIComponent(customerId)}`
    : `${TOOL_URL}/api/v1/tools/orders`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch orders: HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchLiveOrderById(orderId: string): Promise<LiveOrder> {
  const cleanId = orderId.trim().toUpperCase();
  const res = await fetch(`${TOOL_URL}/api/v1/tools/orders/${encodeURIComponent(cleanId)}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Order ${cleanId} was not found in live records.`);
  }
  return await res.json();
}

export async function investigateTicket(
  ticketText: string,
  ticketId?: string,
  orderId?: string
): Promise<InvestigationResult> {
  const payload: Record<string, any> = {
    ticket_text: ticketText,
  };
  if (ticketId) payload.ticket_id = ticketId;
  if (orderId) payload.order_id = orderId;

  const response = await fetch(`${RESOLUTION_URL}/api/v1/resolution/investigate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || JSON.stringify(errorJson);
    } catch {
      // fallback to statusText
    }
    throw new Error(`Resolution Service Error (${response.status}): ${errorDetail}`);
  }

  return await response.json();
}

export async function fetchPolicies(): Promise<PolicyDocument[]> {
  const response = await fetch(`${RAG_URL}/api/v1/rag/policies`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const err = await response.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      // fallback
    }
    throw new Error(`Knowledge Engine Error (${response.status}): ${errorDetail}`);
  }

  return await response.json();
}

export async function checkServiceHealth(name: string, url: string, port: number): Promise<ServiceHealth> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${url}/health`, { method: "GET", cache: "no-store" });
    const latency = Math.round(performance.now() - t0);
    if (res.ok) {
      return {
        service: name,
        port,
        status: "online",
        latencyMs: latency,
        details: await res.json().catch(() => ({})),
      };
    }
  } catch (err) {
    // Offline
  }
  return {
    service: name,
    port,
    status: "offline",
    latencyMs: undefined,
  };
}

export async function fetchAllServiceHealth(): Promise<ServiceHealth[]> {
  return Promise.all([
    checkServiceHealth("Policy & Knowledge Engine (RAG)", RAG_URL, 8000),
    checkServiceHealth("Operational Data & Tools", TOOL_URL, 8001),
    checkServiceHealth("Resolution & LangGraph Orchestrator", RESOLUTION_URL, 8002),
  ]);
}

export async function fetchSavedTickets(limit: number = 20): Promise<SavedTicket[]> {
  try {
    const res = await fetch(`${RESOLUTION_URL}/api/v1/resolution/tickets?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchSavedTicketById(ticketId: string): Promise<SavedTicketDetail | null> {
  try {
    const cleanId = ticketId.trim().toUpperCase();
    const res = await fetch(`${RESOLUTION_URL}/api/v1/resolution/tickets/${encodeURIComponent(cleanId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface AdminSupervisorReview {
  ticket_id: string;
  order_id: string | null;
  customer_id: string | null;
  customer_message: string;
  decision: string;
  status: string;
  summary: string;
  reasoning_summary: string;
  requires_human_review: number;
  review_reasons: string[];
  duration_ms: number;
  created_at: string;
  updated_at: string;
}

export interface SupervisorAlert {
  alert_id: string;
  ticket_id: string;
  order_id: string | null;
  customer_id: string | null;
  channel: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  payload: string;
  dispatched_at: string;
}

export interface SupervisorDecisionResult {
  success: boolean;
  ticket_id: string;
  action: string;
  status: string;
  summary: string;
  actions_taken: string[];
  timestamp: string;
}

export async function fetchAdminPendingReviews(limit: number = 50): Promise<AdminSupervisorReview[]> {
  try {
    const res = await fetch(`${RESOLUTION_URL}/api/v1/resolution/admin/reviews?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchAdminAlerts(limit: number = 50): Promise<SupervisorAlert[]> {
  try {
    const res = await fetch(`${RESOLUTION_URL}/api/v1/resolution/admin/alerts?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function submitSupervisorDecision(
  ticketId: string,
  action: "APPROVE" | "REJECT",
  reviewerId: string = "STORE-SUPERVISOR",
  notes: string = ""
): Promise<SupervisorDecisionResult> {
  const res = await fetch(
    `${RESOLUTION_URL}/api/v1/resolution/admin/reviews/${encodeURIComponent(ticketId)}/decision`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewer_id: reviewerId, notes }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Decision processing failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return await res.json();
}
