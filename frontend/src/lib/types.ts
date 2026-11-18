export type BusinessDecision =
  | "ELIGIBLE"
  | "INELIGIBLE"
  | "NEEDS_MORE_INFORMATION"
  | "NEEDS_HUMAN_REVIEW"
  | "UNABLE_TO_DETERMINE";

export type PipelineStatus = "COMPLETED" | "PARTIAL_EVIDENCE" | "FAILED";

export interface PolicyCitation {
  document_id: string;
  domain: string;
  authority: string;
  section: string;
  source: string;
  score: number;
  snippet: string;
}

export interface OperationalData {
  customer?: Record<string, any> | null;
  order?: Record<string, any> | null;
  payment?: Record<string, any> | null;
  refund?: Record<string, any> | null;
  tools_called: string[];
}

export interface InvestigationResult {
  ticket_id?: string | null;
  status: PipelineStatus;
  decision: BusinessDecision;
  summary: string;
  reasoning_summary: string;
  policy_evidence: PolicyCitation[];
  operational_evidence: OperationalData;
  missing_information: string[];
  requires_human_review: boolean;
  review_reasons: string[];
  actions_taken: string[];
  errors: string[];
  duration_ms: number;
}

export interface PresetTicket {
  id: string;
  title: string;
  category: "standard" | "high_value" | "adversarial" | "conflict" | "missing_info";
  ticket_text: string;
  ticket_id: string;
  order_id?: string;
  description: string;
  expectedOutcome: string;
  badgeColor: string;
}

export type ActiveTab =
  | "concierge"
  | "orders"
  | "policies"
  | "supervisor"
  | "playground"
  | "visualizer"
  | "system";


export interface ServiceHealth {
  service: string;
  port: number;
  status: "online" | "offline" | "checking";
  latencyMs?: number;
  details?: Record<string, any>;
}

export interface PendingCase {
  id: string;
  ticketId: string;
  orderId: string;
  customerName: string;
  orderAmount: number;
  customerMessage: string;
  reasonForReview: string;
  timestamp: string;
  status: "pending" | "approved" | "declined";
  reviewerId?: string;
  notes?: string;
}

export interface SavedTicket {
  ticket_id: string;
  order_id?: string | null;
  customer_id?: string | null;
  customer_message: string;
  decision: BusinessDecision | string;
  status: string;
  summary: string;
  reasoning_summary: string;
  requires_human_review: number;
  review_reasons?: string | null;
  duration_ms?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavedTicketDetail {
  ticket: SavedTicket;
  audit_logs: Array<{
    id: number;
    ticket_id: string;
    node_name?: string | null;
    action: string;
    policy_citations?: string | null;
    operational_snapshot?: string | null;
    details?: string | null;
    timestamp: string;
  }>;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  subject: string;
  message: string;
  orderId?: string;
  channel: "Email" | "Live Chat" | "Portal" | "Mobile App";
  priority: "Urgent" | "High" | "Normal" | "Low";
  createdAt: string;
  status: "resolved" | "pending_review" | "awaiting_customer" | "declined" | "new";
  result?: InvestigationResult | null;
  agentResponse?: string;
  dispatched?: boolean;
}



