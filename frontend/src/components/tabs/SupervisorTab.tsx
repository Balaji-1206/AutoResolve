"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  CheckCircle,
  Clock,
  Check,
  X,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { useToast } from "../Toast";
import { CopyButton } from "../CopyButton";

interface PendingCase {
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

export const SupervisorTab: React.FC = () => {
  const [cases, setCases] = useState<PendingCase[]>([
    {
      id: "case-1",
      ticketId: "TCK-1002",
      orderId: "ORD-1002",
      customerName: "Robert Chen (CUS-1002)",
      orderAmount: 750.0,
      customerMessage:
        "I want to return the 4K Ultra HD TV in order ORD-1002. The screen size does not fit my living room stand.",
      reasonForReview: "Order amount $750.00 exceeds the $500.00 supervisor sign-off threshold (POL-REFUND-001).",
      timestamp: "12 mins ago",
      status: "pending",
    },
    {
      id: "case-2",
      ticketId: "TCK-1006",
      orderId: "ORD-1006",
      customerName: "Elena Rostova (CUS-1006)",
      orderAmount: 210.0,
      customerMessage:
        "My order ORD-1006 arrived damaged yesterday and parts are missing. I want a refund right away.",
      reasonForReview: "Discrepancy: Customer reports delivery, but warehouse tracking shows status 'PROCESSING'.",
      timestamp: "34 mins ago",
      status: "pending",
    },
  ]);

  const [reviewerId, setReviewerId] = useState<string>("SUP-42 (Senior Operations Manager)");
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const toast = useToast();

  const handleAction = (caseId: string, action: "approved" | "declined") => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    const note =
      activeNotes[caseId] ||
      (action === "approved"
        ? "Authorized by senior operations manager."
        : "Declined under company policy guidelines.");

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: action,
              reviewerId,
              notes: note,
            }
          : c
      )
    );

    if (action === "approved") {
      toast.success(
        "Case Authorized & Approved",
        `${targetCase.ticketId} (Order ${targetCase.orderId}) approved by ${reviewerId}`
      );
    } else {
      toast.warning(
        "Case Declined",
        `${targetCase.ticketId} (Order ${targetCase.orderId}) declined under policy guidelines`
      );
    }
  };

  const handleUndo = (caseId: string) => {
    const targetCase = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: "pending",
              reviewerId: undefined,
              notes: undefined,
            }
          : c
      )
    );
    toast.info("Decision Reverted", `${targetCase?.ticketId} returned to pending authorization queue`);
  };

  const handleBatchApprove = () => {
    setCases((prev) =>
      prev.map((c) =>
        c.status === "pending"
          ? {
              ...c,
              status: "approved",
              reviewerId,
              notes: "Batch authorized by supervisor.",
            }
          : c
      )
    );
    toast.success("Batch Authorization Complete", "All pending exceptions authorized.");
  };

  const setQuickNote = (caseId: string, text: string) => {
    setActiveNotes((prev) => ({ ...prev, [caseId]: text }));
    toast.info("Rationale Applied", text);
  };

  const pendingCases = cases.filter((c) => c.status === "pending");
  const resolvedCases = cases.filter((c) => c.status !== "pending");

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 🌟 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Supervisor Authorization Console
            </h2>
            <span className="px-3 py-1 text-xs font-black rounded-full bg-amber-50 text-amber-800 border border-amber-300 shadow-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              Human Oversight Checkpoint
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5">
            Cases safely held by business rules requiring senior manager review before customer responses are finalized.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-slate-500 font-bold">Acting Supervisor:</span>
            <input
              type="text"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all"
            />
          </div>

          {pendingCases.length > 1 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleBatchApprove}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Approve All ({pendingCases.length})</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* 🌟 2. Pending Reviews Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              Awaiting Supervisor Authorization ({pendingCases.length})
            </h3>
          </div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold hidden sm:inline">
            Resolution safely held at executive sign-off gate
          </span>
        </div>

        {pendingCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <AnimatePresence>
              {pendingCases.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -12 }}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.28 }}
                  className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-amber-200 shadow-xl shadow-amber-500/10 space-y-4 sm:space-y-5 relative overflow-hidden"
                >
                  {/* Amber Accent Top Glow Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" />

                  {/* Header Info */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-indigo-700 tracking-tight">
                          {c.ticketId}
                        </span>
                        <span className="text-slate-300 font-bold">•</span>
                        <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                          Order {c.orderId}
                        </span>
                        <CopyButton textToCopy={`${c.ticketId} ${c.orderId}`} label="Copy" />
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 font-bold mt-0.5">
                        {c.customerName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        ${c.orderAmount.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {c.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Customer Message Box */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                      Customer Inquiry
                    </span>
                    "{c.customerMessage}"
                  </div>

                  {/* Policy Trigger Banner */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs sm:text-sm text-amber-950 font-semibold space-y-1 shadow-sm">
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                      Policy Trigger
                    </span>
                    <p className="leading-relaxed">{c.reasonForReview}</p>
                  </div>

                  {/* Quick Rationale Chips */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Rationale Selection
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Authorized: High-value VIP one-time exception",
                        "Authorized: Verified carrier transit damage confirmed",
                        "Declined: Exceeds standard return policy constraints",
                      ].map((presetNote, i) => (
                        <button
                          key={i}
                          onClick={() => setQuickNote(c.id, presetNote)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-semibold transition-colors border border-slate-200/60"
                        >
                          {presetNote.split(":")[0]}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Optional authorization rationale or notes for customer record..."
                      value={activeNotes[c.id] || ""}
                      onChange={(e) =>
                        setActiveNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl sm:rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-800 placeholder-slate-400 font-semibold shadow-sm transition-all"
                    />

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction(c.id, "approved")}
                        className="py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Authorize & Approve</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAction(c.id, "declined")}
                        className="py-3 px-4 rounded-xl sm:rounded-2xl bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-700 font-extrabold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                        <span>Decline Request</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel-elevated p-10 sm:p-12 rounded-3xl text-center space-y-3 border border-emerald-200/60"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900">
              All Exceptions Authorized & Cleared
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-md mx-auto">
              Every high-value order and delivery discrepancy has been reviewed. The system is operating normally within autonomous limits.
            </p>
          </motion.div>
        )}
      </section>

      {/* 🌟 3. Resolved History Section */}
      {resolvedCases.length > 0 && (
        <section className="space-y-3.5 pt-4 border-t border-slate-200/80">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Supervisor Decision Audit Trail ({resolvedCases.length})
          </h3>

          <div className="space-y-2.5">
            {resolvedCases.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel-elevated p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm border border-white"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 ${
                      c.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {c.status === "approved" ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <X className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-xs sm:text-sm">
                      {c.ticketId} • Order {c.orderId} (${c.orderAmount.toFixed(2)})
                    </div>
                    <div className="text-slate-500 font-semibold text-[11px] mt-0.5">
                      {c.reviewerId} • Note: {c.notes}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUndo(c.id)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-all shadow-sm"
                    title="Undo this decision and return to pending"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo</span>
                  </button>

                  <span
                    className={`px-3 py-1 rounded-full font-black uppercase text-[10px] sm:text-xs shadow-sm ${
                      c.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                        : "bg-rose-50 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {c.status === "approved" ? "Manager Approved" : "Manager Declined"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
