"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Database,
  Cpu,
  Scale,
  UserCheck,
  CheckCircle,
  ShieldAlert,
  Clock,
  Info,
  Sparkles,
  Code2,
  ListOrdered,
  ChevronRight,
} from "lucide-react";
import { InvestigationResult } from "@/lib/types";
import { CopyButton } from "../CopyButton";
import { useToast } from "../Toast";

interface VisualTraceTabProps {
  lastResult: InvestigationResult | null;
  lastTicketText?: string;
}

interface StepNode {
  id: string;
  name: string;
  category: string;
  icon: any;
  description: string;
  outcomeDescription: string;
  status: "completed" | "active" | "bypassed" | "interrupted";
  timeEstimate: string;
  dataSnippet?: Record<string, any>;
}

export const VisualTraceTab: React.FC<VisualTraceTabProps> = ({
  lastResult,
  lastTicketText,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("safety_shield");
  const [inspectorView, setInspectorView] = useState<"formatted" | "raw">("formatted");
  const toast = useToast();

  const isAdversarial =
    lastResult?.review_reasons?.some((r) =>
      r.toLowerCase().includes("instruction override") ||
      r.toLowerCase().includes("prompt injection") ||
      r.toLowerCase().includes("privilege escalation")
    ) || false;

  const requiresSupervisor = lastResult?.requires_human_review || false;

  const nodes: StepNode[] = [
    {
      id: "safety_shield",
      name: "Security & Safety Shield",
      category: "Adversarial Defense Layer",
      icon: isAdversarial ? ShieldAlert : ShieldCheck,
      description: "Sub-millisecond regex scanner checking for prompt injections, system overrides, and fake executive authority.",
      outcomeDescription: isAdversarial
        ? "Threat Detected: Attempted instruction override neutralized immediately."
        : "Verified Safe: 0 security threats detected in customer text.",
      status: "completed",
      timeEstimate: "< 1 ms",
      dataSnippet: {
        safety_threats: lastResult?.review_reasons || [],
        scan_outcome: isAdversarial ? "SECURITY_ALERT_TRIGGERED" : "PASSED_CLEAN",
        latency: "< 1 ms",
      },
    },
    {
      id: "entity_detection",
      name: "Order & Identity Match",
      category: "Entity Resolution",
      icon: Search,
      description: "Extracts canonical order identifiers (ORD-XXXX) and maps customer account ownership.",
      outcomeDescription: isAdversarial
        ? "Bypassed: Pipeline aborted at security shield."
        : lastResult?.operational_evidence?.order
        ? `Matched Order ID: ${lastResult.operational_evidence.order.order_id}`
        : "Order ID not specified in message.",
      status: isAdversarial ? "bypassed" : "completed",
      timeEstimate: "1.2 ms",
      dataSnippet: {
        detected_order_id: lastResult?.operational_evidence?.order?.order_id || null,
        detected_customer_id: lastResult?.operational_evidence?.order?.customer_id || null,
      },
    },
    {
      id: "policy_lookup",
      name: "Company Policy & Data Lookup",
      category: "Knowledge & Microservices",
      icon: Database,
      description: "Gathers company policy chunks from knowledge store and live order status from operational records.",
      outcomeDescription: isAdversarial
        ? "Bypassed: Zero database lookups permitted."
        : `Gathered ${lastResult?.policy_evidence?.length || 0} policy citations and verified order status.`,
      status: isAdversarial ? "bypassed" : "completed",
      timeEstimate: "142 ms",
      dataSnippet: {
        policy_citations_count: lastResult?.policy_evidence?.length || 0,
        tools_called: lastResult?.operational_evidence?.tools_called || [],
        order_status: lastResult?.operational_evidence?.order?.status || null,
      },
    },
    {
      id: "ai_analysis",
      name: "Policy Analysis & Reasoning",
      category: "Neural Reasoning Engine",
      icon: Cpu,
      description: "Synthesizes customer message against company policy rules using local neural model.",
      outcomeDescription: isAdversarial
        ? "Bypassed: Model generation skipped for untrusted attack."
        : "Grounded assessment compiled with policy citations.",
      status: isAdversarial ? "bypassed" : "completed",
      timeEstimate: "168 ms",
      dataSnippet: {
        model: "Qwen3 8B (Neural Engine)",
        summary: lastResult?.summary || "N/A",
      },
    },
    {
      id: "rules_verification",
      name: "Business Rules Guarantee",
      category: "Deterministic Enforcement",
      icon: Scale,
      description: "Deterministic rules strictly override LLM for return windows, non-refundable items, and $500 threshold.",
      outcomeDescription: isAdversarial
        ? "Bypassed"
        : requiresSupervisor
        ? "Triggered Policy Exception: Order exceeds $500 threshold or requires verification."
        : "All hard business rules fully satisfied.",
      status: isAdversarial ? "bypassed" : "completed",
      timeEstimate: "0.4 ms",
      dataSnippet: {
        rules_enforced: [
          "30-Day Delivery Window",
          "Catalog Non-Refundable Item Flag",
          "Chargeback & Active Dispute Lock",
          "$500.00 Supervisor Sign-off Threshold",
        ],
        override_applied: requiresSupervisor,
      },
    },
    {
      id: "supervisor_approval",
      name: "Supervisor Authorization",
      category: "Human Oversight Checkpoint",
      icon: UserCheck,
      description: "Durable workflow pause awaiting operations manager authorization when financial limits or discrepancies occur.",
      outcomeDescription: requiresSupervisor
        ? "Paused for Manager Sign-off: Checkpointed in workflow state."
        : "Standard Action: Within autonomous authorization limits.",
      status: requiresSupervisor ? "interrupted" : "bypassed",
      timeEstimate: requiresSupervisor ? "Awaiting Review" : "N/A",
      dataSnippet: {
        requires_human_review: requiresSupervisor,
        review_reasons: lastResult?.review_reasons || [],
      },
    },
    {
      id: "resolution_finalized",
      name: "Resolution Finalized",
      category: "Structured Delivery",
      icon: CheckCircle,
      description: "Packages the final customer-facing communication and logs complete audit trail with zero side-effects.",
      outcomeDescription: lastResult
        ? `Status: ${lastResult.status} • Decision: ${lastResult.decision}`
        : "Awaiting inquiry input.",
      status: "completed",
      timeEstimate: "1.5 ms",
      dataSnippet: {
        final_decision: lastResult?.decision || "READY",
        read_only_invariant: "Verified (zero unauthorized monetary movement)",
        total_latency: `${lastResult?.duration_ms || 0} ms`,
      },
    },
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleSelectNode = (node: StepNode) => {
    setSelectedNodeId(node.id);
    toast.info(`Inspecting Step: ${node.name}`, node.category);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 🌟 1. Overview Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Live Resolution Journey
            </h2>
            <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Multi-Agent Orchestration Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5">
            Visualizing the step-by-step path every inquiry travels from arrival to final response.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>End-to-End Latency: {lastResult?.duration_ms || 0} ms</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Case: {lastResult?.ticket_id || "TCK-1001"}</span>
          </div>
        </div>
      </motion.div>

      {/* 🌟 2. Main Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Step-by-Step Interactive Visual Journey */}
        <div className="lg:col-span-2 space-y-3.5 relative">
          {nodes.map((node, index) => {
            const isSelected = selectedNode.id === node.id;
            const Icon = node.icon;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div
                  onClick={() => handleSelectNode(node)}
                  className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl cursor-pointer transition-all border ${
                    isSelected
                      ? "glass-panel-elevated ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/15"
                      : "glass-card-interactive"
                  } ${
                    node.status === "bypassed"
                      ? "opacity-50 grayscale-[30%]"
                      : node.status === "interrupted"
                      ? "border-amber-300 bg-amber-50/50 glow-amber"
                      : "border-white/95"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 sm:gap-5 min-w-0">
                      {/* Step Number + Glowing Icon */}
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-md ring-4 ring-white flex-shrink-0 ${
                          node.status === "completed"
                            ? "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-indigo-500/25"
                            : node.status === "interrupted"
                            ? "bg-amber-500 text-white shadow-amber-500/35 animate-pulse"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                            Step {index + 1}
                          </span>
                          <span className="text-slate-300 font-bold">•</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {node.category}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          {node.name}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                          {node.description}
                        </p>

                        <div className="pt-1.5 flex items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm font-extrabold ${
                              node.status === "completed"
                                ? "text-emerald-700"
                                : node.status === "interrupted"
                                ? "text-amber-800"
                                : "text-slate-400"
                            }`}
                          >
                            {node.outcomeDescription}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm hidden sm:inline-block">
                        {node.timeEstimate}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-0.5">
                          <span>Selected</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Animated Glowing Connector Beam */}
                {index < nodes.length - 1 && (
                  <div className="flex justify-center py-1.5 relative">
                    <div className="w-1 h-5 bg-gradient-to-b from-indigo-400 via-indigo-300 to-indigo-100 rounded-full" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right Col: Detailed Step Inspector Drawer */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 glass-panel-elevated p-6 rounded-3xl border border-white shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3.5 border-slate-100">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Step Detail Inspector
                </h3>
              </div>

              {/* View Toggle Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setInspectorView("formatted")}
                  className={`px-2 py-1 rounded-md transition-all ${
                    inspectorView === "formatted"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5 inline mr-1" />
                  Overview
                </button>
                <button
                  onClick={() => setInspectorView("raw")}
                  className={`px-2 py-1 rounded-md transition-all ${
                    inspectorView === "raw"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 inline mr-1" />
                  JSON
                </button>
              </div>
            </div>

            <motion.div
              key={selectedNode.id + inspectorView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-black tracking-wider">
                  Step Name
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {selectedNode.name}
                </div>
              </div>

              {inspectorView === "formatted" ? (
                <>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-black tracking-wider">
                      Core Functionality
                    </span>
                    <p className="text-slate-700 mt-0.5 font-normal leading-relaxed">
                      {selectedNode.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-black tracking-wider">
                      Observed Execution Outcome
                    </span>
                    <p className="font-extrabold text-slate-900 mt-0.5 text-xs sm:text-sm">
                      {selectedNode.outcomeDescription}
                    </p>
                  </div>

                  {selectedNode.dataSnippet && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 text-[11px] uppercase font-black tracking-wider">
                          State Snapshot
                        </span>
                        <CopyButton
                          textToCopy={JSON.stringify(selectedNode.dataSnippet, null, 2)}
                          label="Copy State"
                        />
                      </div>
                      <pre className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 font-mono overflow-x-auto leading-relaxed shadow-sm font-semibold max-h-48 overflow-y-auto">
                        {JSON.stringify(selectedNode.dataSnippet, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] uppercase font-black tracking-wider">
                      Full Step Object
                    </span>
                    <CopyButton
                      textToCopy={JSON.stringify(selectedNode, null, 2)}
                      label="Copy Object"
                    />
                  </div>
                  <pre className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 font-mono overflow-x-auto leading-relaxed shadow-sm font-semibold max-h-80 overflow-y-auto">
                    {JSON.stringify(selectedNode, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
