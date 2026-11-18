"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Package,
  CreditCard,
  Truck,
  Send,
  Eye,
  Check,
  X,
  Radio,
  FileText,
  DollarSign,
  User,
  Activity,
  Layers,
} from "lucide-react";
import {
  fetchAdminPendingReviews,
  fetchAdminAlerts,
  submitSupervisorDecision,
  AdminSupervisorReview,
  SupervisorAlert,
} from "@/lib/api";
import { ToastProvider, useToast } from "@/components/Toast";
import { CopyButton } from "@/components/CopyButton";

function AdminConsoleContent() {
  const [reviews, setReviews] = useState<AdminSupervisorReview[]>([]);
  const [alerts, setAlerts] = useState<SupervisorAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"queue" | "alerts" | "history">("queue");

  // Selected case for detailed review
  const [selectedCase, setSelectedCase] = useState<AdminSupervisorReview | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const toast = useToast();

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [pendingReviews, alertFeed] = await Promise.all([
        fetchAdminPendingReviews(50),
        fetchAdminAlerts(50),
      ]);
      setReviews(pendingReviews);
      setAlerts(alertFeed);
    } catch (err: any) {
      toast.error("Data Fetch Failed", err.message || "Could not load supervisor data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (caseItem: AdminSupervisorReview) => {
    setIsActionLoading(true);
    try {
      const res = await submitSupervisorDecision(
        caseItem.ticket_id,
        "APPROVE",
        "MGR-OPERATIONS",
        reviewNotes || "Approved by operations supervisor. Exception granted under customer loyalty policy."
      );

      toast.success(
        "Exception Approved & Executed!",
        `Refund and return voucher allocated. Action: ${res.actions_taken.join(" • ") || "Executed"}`
      );

      // Refresh list
      setReviews((prev) => prev.filter((r) => r.ticket_id !== caseItem.ticket_id));
      setSelectedCase(null);
      setReviewNotes("");
      loadData();
    } catch (err: any) {
      toast.error("Approval Failed", err.message || "Failed to process approval");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (caseItem: AdminSupervisorReview) => {
    setIsActionLoading(true);
    try {
      const res = await submitSupervisorDecision(
        caseItem.ticket_id,
        "REJECT",
        "MGR-OPERATIONS",
        reviewNotes || "Inquiry reviewed and declined. Purchase exceeds policy thresholds."
      );

      toast.info(
        "Review Declined",
        `Ticket ${caseItem.ticket_id} has been marked rejected.`
      );

      setReviews((prev) => prev.filter((r) => r.ticket_id !== caseItem.ticket_id));
      setSelectedCase(null);
      setReviewNotes("");
      loadData();
    } catch (err: any) {
      toast.error("Rejection Failed", err.message || "Failed to record decision");
    } finally {
      setIsActionLoading(false);
    }
  };

  const pendingReviewsList = reviews.filter((r) => r.requires_human_review === 1);
  const resolvedReviewsList = reviews.filter((r) => r.requires_human_review === 0);

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden mesh-subtle-overlay selection:bg-amber-100 selection:text-amber-900">
      {/* 🌟 1. Apple Fluid Amber / Rose Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 25, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-amber-400/20 via-orange-300/15 to-transparent blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -45, 35, 0],
            y: [0, 55, -25, 0],
            scale: [1, 1.2, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -right-36 w-[36rem] h-[36rem] rounded-full bg-gradient-to-bl from-rose-300/20 via-orange-200/15 to-transparent blur-3xl"
        />
      </div>

      {/* 🌟 2. Apple iOS Fluid Frosted Glass Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/80 bg-white/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Return to Portal Selector"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 ring-2 ring-white/95">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                  Operations Console
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-sm leading-tight">
                  Supervisor Level
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5 hidden sm:block">
                Asynchronous Human-in-the-Loop Orchestration & Write Authority
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white/90 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/customer"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>View Customer Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 🌟 3. Main Dashboard Body */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        {/* KPI Summary Cards (Apple Fluid Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -3 }}
            className="glass-panel p-5 rounded-3xl border border-white/90 shadow-sm bg-white/70 backdrop-blur-xl flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Supervisor Reviews
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {pendingReviewsList.length}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Requires manual authorization
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="glass-panel p-5 rounded-3xl border border-white/90 shadow-sm bg-white/70 backdrop-blur-xl flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Dispatched Slack Alerts
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                {alerts.length}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                External asynchronous channel
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="glass-panel p-5 rounded-3xl border border-white/90 shadow-sm bg-white/70 backdrop-blur-xl flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Database Engine Status
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-600 mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>SQLite WAL Durable</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                LangGraph Checkpointer Active
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        {/* Apple iOS Fluid Segmented Control */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-200">
          <div className="glass-panel p-1.5 rounded-2xl border border-white shadow-sm flex items-center gap-1 bg-white/60">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === "queue"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Pending Reviews</span>
              {pendingReviewsList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                  {pendingReviewsList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === "alerts"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>HITL Alerts Feed</span>
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500 text-white font-black">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>

          <span className="text-xs text-slate-500 font-semibold hidden md:inline">
            Auto-polling every 12 seconds
          </span>
        </div>

        {/* Tab 1: Pending Reviews Queue */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            {pendingReviewsList.length === 0 ? (
              <div className="glass-panel-elevated p-12 rounded-3xl text-center space-y-3 bg-white/70 border border-white shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Supervisor Queue Clear
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                  All automated inquiries have either been resolved by AI microservices or approved by operations supervisors.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingReviewsList.map((review) => (
                  <motion.div
                    key={review.ticket_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel-elevated p-6 rounded-3xl border border-white/90 shadow-md bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 font-black text-xs">
                          <AlertTriangle className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-slate-900">
                              {review.ticket_id}
                            </h4>
                            {review.order_id && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                                {review.order_id}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">
                            Customer: {review.customer_id || "Unspecified"} • Created {review.created_at}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                          NEEDS SUPERVISOR SIGN-OFF
                        </span>
                      </div>
                    </div>

                    {/* Customer Message */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Customer Inquiry
                      </div>
                      <p className="italic font-normal">"{review.customer_message}"</p>
                    </div>

                    {/* Trigger Reasons */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                      <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                        Escalation Trigger Reason
                      </div>
                      <p className="font-semibold">
                        {Array.isArray(review.review_reasons) && review.review_reasons.length > 0
                          ? review.review_reasons.join("; ")
                          : review.reasoning_summary || review.summary}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedCase(review);
                          setReviewNotes("");
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Full Case</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(review)}
                          disabled={isActionLoading}
                          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200 transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline Request</span>
                        </button>

                        <button
                          onClick={() => handleApprove(review)}
                          disabled={isActionLoading}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Exception & Execute</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Asynchronous HITL Alerts Feed */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-2xl bg-white/70 border border-white text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span className="font-bold text-slate-800">
                  External Notification Dispatcher Log
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                Channel: slack:#support-escalations
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl text-center space-y-2 text-slate-400 bg-white/60">
                <Radio className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No external alerts recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.alert_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white/85 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          {alert.alert_id}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-bold text-slate-900">
                          {alert.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {alert.message}
                      </p>
                      <div className="text-[10px] text-slate-400 font-semibold pt-1">
                        Channel: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">{alert.channel}</code> • Dispatched {alert.dispatched_at}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : alert.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {alert.severity}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {alert.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🌟 4. Case Inspection & Sign-off Drawer Modal */}
      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glass-panel-elevated bg-white/95 rounded-3xl border border-white shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Supervisor Case Review
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      Ticket {selectedCase.ticket_id} • Order {selectedCase.order_id || "N/A"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Case Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer ID
                  </span>
                  <div className="font-bold text-slate-900 font-mono">
                    {selectedCase.customer_id || "N/A"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Current AI Status
                  </span>
                  <div className="font-bold text-amber-700">
                    {selectedCase.status}
                  </div>
                </div>
              </div>

              {/* Customer Text */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Original Customer Message
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  "{selectedCase.customer_message}"
                </p>
              </div>

              {/* AI Reasoning Summary */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                  Reason for Review & Policy Analysis
                </span>
                <p className="text-amber-950 leading-relaxed font-medium">
                  {selectedCase.reasoning_summary || selectedCase.summary}
                </p>
              </div>

              {/* Supervisor Notes Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">
                  Supervisor Audit Notes & Authorization Remarks:
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified customer history. Approved one-time exception under 100% satisfaction guarantee."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-xs font-medium text-slate-900 outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReject(selectedCase)}
                    disabled={isActionLoading}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs border border-rose-200"
                  >
                    Decline Request
                  </button>

                  <button
                    onClick={() => handleApprove(selectedCase)}
                    disabled={isActionLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-500/25"
                  >
                    {isActionLoading ? "Processing Write..." : "Approve Exception & Execute"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🌟 5. Apple Fluid Glass Footer */}
      <footer className="relative z-10 w-full border-t border-white/80 bg-white/60 backdrop-blur-xl py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between text-xs text-slate-400 font-semibold gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">AutoResolve AI Operations</span>
            <span>•</span>
            <span>Automated Write Operations (Phase 2 Refund & Label Execution)</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Gateway</span>
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminConsoleContent />
    </ToastProvider>
  );
}
