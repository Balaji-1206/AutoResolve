"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  ShieldAlert,
  CheckCircle,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  User,
  Package,
} from "lucide-react";
import { PendingCase } from "@/lib/types";
import { useToast } from "./Toast";
import { CopyButton } from "./CopyButton";

interface SupervisorNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: PendingCase[];
  setCases: React.Dispatch<React.SetStateAction<PendingCase[]>>;
}

export const SupervisorNotificationModal: React.FC<SupervisorNotificationModalProps> = ({
  isOpen,
  onClose,
  cases,
  setCases,
}) => {
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});
  const toast = useToast();

  const pendingCases = cases.filter((c) => c.status === "pending");
  const resolvedCases = cases.filter((c) => c.status !== "pending");

  const handleAction = (caseId: string, action: "approved" | "declined") => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase) return;

    const note =
      activeNotes[caseId] ||
      (action === "approved"
        ? "Authorized by Senior Operations Supervisor."
        : "Declined under company financial guidelines.");

    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: action,
              reviewerId: "SUP-42 (Operations Lead)",
              notes: note,
            }
          : c
      )
    );

    if (action === "approved") {
      toast.success(
        "Refund Authorized",
        `${targetCase.ticketId} (Order ${targetCase.orderId}) approved. Customer notified.`
      );
    } else {
      toast.warning(
        "Request Declined",
        `${targetCase.ticketId} declined under company policy guidelines.`
      );
    }
  };

  const handleUndo = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, status: "pending", notes: undefined } : c
      )
    );
    toast.info("Decision Reverted", "Ticket returned to pending alert queue.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl border border-white shadow-2xl w-full max-w-3xl p-6 sm:p-8 space-y-5 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 shadow-sm">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Supervisor Alert Center
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {pendingCases.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Human-in-the-Loop review triggered only when autonomous limits are exceeded.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
          <strong className="text-slate-900 font-bold block mb-0.5">
            How Autonomous Escalation Works:
          </strong>
          Customers interact directly with the website. Routine requests are resolved 100% automatically without employee involvement. When a request hits a high-risk boundary (such as order totals over $500.00), AutoResolve sends a notification here for your approval.
        </div>

        {/* Active Pending Alerts */}
        <div className="space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
            Active Exception Notifications ({pendingCases.length})
          </span>

          {pendingCases.length > 0 ? (
            <div className="space-y-4">
              {pendingCases.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-sm space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-indigo-700">{c.ticketId}</span>
                        <span className="text-slate-300 font-bold">•</span>
                        <span className="text-sm font-black text-slate-900">Order {c.orderId}</span>
                        <span className="text-xs text-slate-500 font-bold">({c.customerName})</span>
                      </div>
                      <div className="text-xs text-amber-800 font-bold mt-1 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span>{c.reasonForReview}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        ${c.orderAmount.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">{c.timestamp}</span>
                    </div>
                  </div>

                  {/* Customer Inquiry Quote */}
                  <div className="p-3 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-700 leading-relaxed font-normal">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">
                      Customer Inquiry
                    </span>
                    "{c.customerMessage}"
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Optional supervisor rationale / note..."
                      value={activeNotes[c.id] || ""}
                      onChange={(e) =>
                        setActiveNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      className="flex-1 min-w-[200px] px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(c.id, "approved")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Authorize Refund</span>
                      </button>

                      <button
                        onClick={() => handleAction(c.id, "declined")}
                        className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-50 transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-sm font-bold text-slate-800">
                Supervisor Queue Clear
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No tickets currently require human intervention. All customer inquiries are being resolved autonomously by AutoResolve.
              </p>
            </div>
          )}
        </div>

        {/* Resolved History */}
        {resolvedCases.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Recent Supervisor Decisions ({resolvedCases.length})
            </span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {resolvedCases.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.status === "approved" ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="font-bold text-slate-900">{c.ticketId}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">Order {c.orderId}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{c.notes}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUndo(c.id)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Undo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        c.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
