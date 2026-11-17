import { InvestigationResult, ServiceHealth } from "./types";

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
