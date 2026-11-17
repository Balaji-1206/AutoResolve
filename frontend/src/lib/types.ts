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

export type ActiveTab = "playground" | "visualizer" | "supervisor" | "system";

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


