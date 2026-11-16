"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  FileText,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Download,
  Filter,
} from "lucide-react";
import { PRESET_TICKETS } from "@/lib/presets";
import { investigateTicket } from "@/lib/api";
import { InvestigationResult, PresetTicket, ActiveTab } from "@/lib/types";
import { useToast } from "../Toast";
import { CopyButton } from "../CopyButton";

interface PlaygroundTabProps {
  onSwitchTab: (tab: ActiveTab) => void;
  onNewResult?: (result: InvestigationResult, ticketText: string) => void;
}

export const PlaygroundTab: React.FC<PlaygroundTabProps> = ({
  onSwitchTab,
  onNewResult,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("preset-1");
  const [ticketText, setTicketText] = useState<string>(PRESET_TICKETS[0].ticket_text);
  const [ticketId, setTicketId] = useState<string>(PRESET_TICKETS[0].ticket_id);
  const [orderId, setOrderId] = useState<string | undefined>(PRESET_TICKETS[0].order_id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const toast = useToast();

  const handleSelectPreset = (preset: PresetTicket) => {
    setSelectedPreset(preset.id);
    setTicketText(preset.ticket_text);
    setTicketId(preset.ticket_id);
    setOrderId(preset.order_id);
    setResult(null);
    toast.info("Scenario Loaded", `${preset.ticket_id}: ${preset.title}`);
  };

  const handleClearText = () => {
    setTicketText("");
    setOrderId(undefined);
    setResult(null);
    toast.info("Editor Cleared", "Type a custom inquiry or select a preset scenario.");
  };

  const handleRunInvestigation = async () => {
    if (!ticketText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await investigateTicket(ticketText, ticketId, orderId);
      setResult(res);
      if (onNewResult) {
        onNewResult(res, ticketText);
      }
      toast.success(
        "Resolution Evaluated",
        `${res.decision.replace(/_/g, " ")} (${res.duration_ms} ms)`
      );
    } catch (err) {
      toast.error("Execution Error", "Failed to evaluate inquiry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunInvestigation();
    }
  };

  const handleExportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autoresolve-audit-${result.ticket_id || "ticket"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit Report Exported", `Downloaded JSON record for ${result.ticket_id}`);
  };

  const filteredPresets =
    filterCategory === "all"
      ? PRESET_TICKETS
      : PRESET_TICKETS.filter((p) => p.category === filterCategory);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "ELIGIBLE":
        return {
          label: "Approved & Fully Eligible",
          icon: CheckCircle2,
          bg: "bg-emerald-50/95 border-emerald-300 text-emerald-950 glow-emerald",
          chip: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25",
        };
      case "NEEDS_HUMAN_REVIEW":
        return {
          label: "Requires Senior Supervisor Authorization",
          icon: AlertTriangle,
          bg: "bg-amber-50/95 border-amber-300 text-amber-950 glow-amber",
          chip: "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/25",
        };
      case "INELIGIBLE":
        return {
          label: "Ineligible Under Policy Guidelines",
          icon: XCircle,
          bg: "bg-slate-50/95 border-slate-300 text-slate-800",
          chip: "bg-slate-700 text-white shadow-md",
        };
      case "NEEDS_MORE_INFORMATION":
        return {
          label: "Missing Order Identifier (ORD-XXXX)",
          icon: HelpCircle,
          bg: "bg-sky-50/95 border-sky-300 text-sky-950 glow-indigo",
          chip: "bg-sky-600 text-white shadow-md shadow-sky-500/20",
        };
      default:
        return {
          label: "Resolution Review Pending",
          icon: AlertTriangle,
          bg: "bg-slate-50 border-slate-200 text-slate-700",
          chip: "bg-slate-600 text-white",
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 🌟 1. Instant Demonstration Scenarios Strip */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-sm flex-shrink-0">
              <Zap className="w-4 h-4 fill-indigo-100" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Instant Demonstration Scenarios
            </h2>
          </div>

          {/* Scenario Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: "all", label: "All Scenarios" },
              { id: "standard", label: "Standard" },
              { id: "high_value", label: "High-Value" },
              { id: "adversarial", label: "Security Shield" },
              { id: "conflict", label: "Discrepancy" },
              { id: "missing_info", label: "Missing Info" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                className={`px-3 py-1 rounded-full transition-all text-xs font-bold whitespace-nowrap ${
                  filterCategory === f.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filteredPresets.map((p, index) => {
            const isSelected = selectedPreset === p.id;
            return (
              <motion.button
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPreset(p)}
                className={`p-3.5 sm:p-4 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between h-full border ${
                  isSelected
                    ? "glass-panel-elevated ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/15 border-indigo-200"
                    : "glass-card-interactive"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-indigo-700 tracking-wider">
                      {p.ticket_id}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ring-2 ring-white shadow-sm ${
                        p.badgeColor === "emerald"
                          ? "bg-emerald-500"
                          : p.badgeColor === "amber"
                          ? "bg-amber-500"
                          : p.badgeColor === "rose"
                          ? "bg-rose-500"
                          : p.badgeColor === "indigo"
                          ? "bg-indigo-500"
                          : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {p.title}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed font-medium">
                  {p.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 🌟 2. Interactive Ticket Console */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl shadow-xl border border-white space-y-4 sm:space-y-5 relative overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Customer Support Ticket
            </span>
            {orderId && (
              <span className="px-3 py-1 text-xs font-black rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-sm flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Target Order: {orderId}
              </span>
            )}
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
              Case Ref: {ticketId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Deterministic Rule Guarantee</span>
            </div>
            {ticketText && (
              <button
                onClick={handleClearText}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
                title="Clear inquiry text"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={4}
            value={ticketText}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setTicketText(e.target.value);
              const match = e.target.value.match(/\bORD-\d+\b/i);
              setOrderId(match ? match[0].toUpperCase() : undefined);
            }}
            placeholder="Type customer message or select an automated scenario above... (Press Ctrl + Enter to submit)"
            className="w-full p-4 sm:p-5 rounded-2xl bg-white/80 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 text-sm sm:text-base text-slate-900 placeholder-slate-400 transition-all outline-none resize-none font-medium leading-relaxed shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
            <span>{ticketText.length} characters</span>
            <span>•</span>
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Enter</kbd> to execute</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunInvestigation}
            disabled={isLoading || !ticketText.trim()}
            className="relative overflow-hidden h-12 sm:h-14 px-7 sm:px-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-500/25 flex items-center gap-2.5 transition-all disabled:opacity-50 disabled:pointer-events-none group"
          >
            {/* Shimmer Light Streak */}
            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 animate-shimmer-sweep pointer-events-none" />

            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating Evidence & Rules...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Run Intelligent Resolution</span>
                <Send className="w-4 h-4 text-indigo-200 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </motion.button>
        </div>
      </motion.section>

      {/* 🌟 3. Fluid Resolution Outcome Display */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-2xl space-y-6 sm:space-y-8"
          >
            {/* Header Outcome Banner */}
            {(() => {
              const badge = getDecisionBadge(result.decision);
              const BadgeIcon = badge.icon;
              return (
                <div
                  className={`p-5 sm:p-6 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 transition-all ${badge.bg}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl shadow-md ${badge.chip}`}>
                      <BadgeIcon className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-black tracking-wider opacity-80">
                        Authoritative Resolution Decision
                      </div>
                      <div className="text-lg sm:text-2xl font-black tracking-tight mt-0.5">
                        {badge.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/95 border border-slate-200 shadow-sm text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Latency: {result.duration_ms} ms</span>
                    </div>

                    <button
                      onClick={handleExportJSON}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200 text-xs font-bold shadow-sm transition-all"
                      title="Download full JSON audit report"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Export JSON</span>
                    </button>

                    {result.requires_human_review && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSwitchTab("supervisor")}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-black shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all"
                      >
                        <span>Authorize in Supervisor Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Customer Reply & Grounded Reasoning Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="p-5 sm:p-6 rounded-2xl bg-white/85 border border-slate-200/90 space-y-2.5 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Customer-Facing Response
                  </span>
                  <CopyButton textToCopy={result.summary} label="Copy Reply" />
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  {result.summary}
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white/85 border border-slate-200/90 space-y-2.5 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    Policy Analysis & Grounded Reasoning
                  </span>
                  <CopyButton textToCopy={result.reasoning_summary} label="Copy Analysis" />
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                  {result.reasoning_summary}
                </p>
              </div>
            </div>

            {/* Policy Citations & Verified Operational Facts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Policy Evidence */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Company Policy Citations (Grounded Knowledge)
                </h3>
                {result.policy_evidence.length > 0 ? (
                  <div className="space-y-3">
                    {result.policy_evidence.map((c, i) => (
                      <div
                        key={i}
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-sm space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="text-indigo-600 font-black text-xs sm:text-sm">
                            [{c.document_id}]
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Semantic Relevance: {(c.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">{c.section}</div>
                        <p className="text-slate-600 text-xs leading-relaxed font-normal">
                          {c.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-500 font-medium">
                    No policy citations required for this inquiry path.
                  </div>
                )}
              </div>

              {/* Operational Facts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    Operational Records (Live Tool Verification)
                  </h3>
                  {result.operational_evidence.order && (
                    <CopyButton
                      textToCopy={JSON.stringify(result.operational_evidence.order, null, 2)}
                      label="Copy Order"
                    />
                  )}
                </div>
                {result.operational_evidence.order ? (
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 text-sm space-y-3 shadow-sm">
                    <div className="flex items-center justify-between font-black text-slate-900 border-b pb-3 border-slate-100 text-base">
                      <span>Order {result.operational_evidence.order.order_id}</span>
                      <span className="text-emerald-700 font-black text-lg sm:text-xl">
                        ${result.operational_evidence.order.total_amount?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 text-slate-700 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-bold">Delivery Status</span>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {result.operational_evidence.order.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-bold">Product Category</span>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {result.operational_evidence.order.product_category || "General"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-bold">Carrier Timestamp</span>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {result.operational_evidence.order.delivered_at
                            ? new Date(result.operational_evidence.order.delivered_at).toLocaleDateString()
                            : "Processing"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-bold">Customer Account</span>
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                          {result.operational_evidence.order.customer_id}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-500 font-medium">
                    No order record retrieved or lookups were bypassed by security shield.
                  </div>
                )}
              </div>
            </div>

            {/* Shortcut to Live Visual Journey */}
            <div className="pt-2 flex justify-end">
              <motion.button
                whileHover={{ x: 3 }}
                onClick={() => onSwitchTab("visualizer")}
                className="text-xs sm:text-sm font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-all"
              >
                <span>View Live Step-by-Step Resolution Journey</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};
