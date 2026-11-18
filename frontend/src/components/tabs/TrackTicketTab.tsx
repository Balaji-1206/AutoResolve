"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Printer,
  Download,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileText,
  CornerDownRight,
  ExternalLink,
} from "lucide-react";
import { fetchSavedTicketById, fetchSavedTickets } from "@/lib/api";
import { SavedTicket, SavedTicketDetail } from "@/lib/types";
import { ReturnShippingLabelModal } from "../ReturnShippingLabelModal";
import { CopyButton } from "../CopyButton";
import { useToast } from "../Toast";

interface TrackTicketTabProps {
  initialTicketId?: string;
  onNavigateToConcierge?: () => void;
}

export const TrackTicketTab: React.FC<TrackTicketTabProps> = ({
  initialTicketId = "TCK-1001",
  onNavigateToConcierge,
}) => {
  const [ticketQuery, setTicketQuery] = useState<string>(initialTicketId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ticketData, setTicketData] = useState<SavedTicketDetail | null>(null);
  const [recentTickets, setRecentTickets] = useState<SavedTicket[]>([]);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState<boolean>(false);
  const toast = useToast();

  const handleTrackTicket = async (idToTrack?: string) => {
    const id = (idToTrack || ticketQuery).trim().toUpperCase();
    if (!id || isLoading) return;
    setIsLoading(true);

    try {
      const data = await fetchSavedTicketById(id);
      if (data && data.ticket) {
        setTicketData(data);
        setTicketQuery(id);
        toast.success("Request Found", `Tracking timeline loaded for ${id}`);
      } else {
        toast.error("Not Found", `No inquiry was found matching ticket ID ${id}`);
        setTicketData(null);
      }
    } catch (err: any) {
      toast.error("Lookup Error", err.message || "Failed to retrieve ticket record.");
      setTicketData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedTickets(8).then((tickets) => {
      setRecentTickets(tickets);
    });
    if (initialTicketId) {
      handleTrackTicket(initialTicketId);
    }
  }, [initialTicketId]);

  // Extract transaction details from ticket summary or audit logs
  const ticket = ticketData?.ticket;
  const auditLogs = ticketData?.audit_logs || [];

  const summaryText = ticket?.summary || "";
  const txMatch = summaryText.match(/Gateway Ref: (tx_[^\)]+)/) || summaryText.match(/via (tx_[^\)]+)/);
  const gatewayTx = txMatch ? txMatch[1] : undefined;

  const trackingMatch = summaryText.match(/Return tracking number: ([A-Za-z0-9]+)/) || summaryText.match(/Tracking #([A-Za-z0-9]+)/);
  const trackingNumber = trackingMatch ? trackingMatch[1] : undefined;

  // Determine stage progression (1 to 5)
  const isApproved = ticket?.decision === "ELIGIBLE" || ticket?.status === "APPROVED";
  const isUnderReview = ticket?.decision === "NEEDS_HUMAN_REVIEW" || ticket?.status === "PENDING_REVIEW";
  const isDeclined = ticket?.decision === "INELIGIBLE" || ticket?.status === "REJECTED";

  const currentStep = isApproved ? 5 : isUnderReview ? 3 : isDeclined ? 3 : 2;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 🌟 1. Apple-Style Fluid Search & Lookup Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl bg-white/80 backdrop-blur-2xl space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Track My Request
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Enter your ticket authorization number (e.g. TCK-1001) to check live status
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
            Real-Time Resolution Ledger
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrackTicket();
          }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Ticket ID (e.g. TCK-1001 or TCK-1002)"
              value={ticketQuery}
              onChange={(e) => setTicketQuery(e.target.value.toUpperCase())}
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-900 outline-none shadow-sm transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !ticketQuery.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Track Request</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Tickets */}
        {recentTickets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Recent Inquiries:
            </span>
            {recentTickets.slice(0, 5).map((t) => (
              <button
                key={t.ticket_id}
                type="button"
                onClick={() => handleTrackTicket(t.ticket_id)}
                className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all border ${
                  ticketQuery === t.ticket_id
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                <span>{t.ticket_id}</span>
                {t.order_id && <span className="text-slate-400 font-medium"> ({t.order_id})</span>}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* 🌟 2. Ticket Tracking Progress Display */}
      {ticket ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Status Header Card */}
          <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl bg-white/80 backdrop-blur-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5 border-slate-100">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    isApproved
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/25"
                      : isUnderReview
                      ? "bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/25"
                      : "bg-gradient-to-tr from-rose-600 to-pink-600 shadow-rose-500/25"
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : isUnderReview ? (
                    <Clock className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      {ticket.ticket_id}
                    </h3>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isUnderReview
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {isApproved
                        ? "Return Approved & Processed"
                        : isUnderReview
                        ? "Manager Sign-Off in Progress"
                        : "Return Declined"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Order Ref: {ticket.order_id || "N/A"} • Submitted on {ticket.created_at}
                  </p>
                </div>
              </div>

              {isApproved && (
                <button
                  onClick={() => setIsLabelModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Prepaid Shipping Label</span>
                </button>
              )}
            </div>

            {/* Apple iOS Fluid Multi-Step Progress Tracker */}
            <div className="py-4">
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-slate-100 rounded-full hidden sm:block">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isApproved ? "bg-emerald-500 w-full" : isUnderReview ? "bg-amber-400 w-1/2" : "bg-rose-400 w-1/2"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                  {/* Step 1 */}
                  <div className="text-center sm:text-left space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-md shadow-emerald-500/25">
                      ✓
                    </div>
                    <div className="font-black text-xs text-slate-900 pt-1">
                      1. Request Received
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Inquiry logged in database
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="text-center sm:text-left space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-md shadow-emerald-500/25">
                      ✓
                    </div>
                    <div className="font-black text-xs text-slate-900 pt-1">
                      2. Policy Check
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      30-Day guarantee evaluated
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="text-center sm:text-left space-y-1">
                    <div
                      className={`w-10 h-10 rounded-2xl text-white font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-md ${
                        isApproved
                          ? "bg-emerald-500 shadow-emerald-500/25"
                          : isUnderReview
                          ? "bg-amber-500 animate-pulse shadow-amber-500/25"
                          : "bg-rose-500 shadow-rose-500/25"
                      }`}
                    >
                      {isApproved ? "✓" : isUnderReview ? "3" : "✕"}
                    </div>
                    <div className="font-black text-xs text-slate-900 pt-1">
                      3. Decision
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {isApproved
                        ? "Approved"
                        : isUnderReview
                        ? "Manager Reviewing"
                        : "Declined"}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="text-center sm:text-left space-y-1">
                    <div
                      className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-md ${
                        isApproved
                          ? "bg-emerald-500 text-white shadow-emerald-500/25"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isApproved ? "✓" : "4"}
                    </div>
                    <div className="font-black text-xs text-slate-900 pt-1">
                      4. Prepaid Return Label
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {trackingNumber ? "Carrier: UPS Ground" : "Pending approval"}
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="text-center sm:text-left space-y-1">
                    <div
                      className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center mx-auto sm:mx-0 shadow-md ${
                        isApproved
                          ? "bg-emerald-500 text-white shadow-emerald-500/25"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isApproved ? "✓" : "5"}
                    </div>
                    <div className="font-black text-xs text-slate-900 pt-1">
                      5. Refund Issued
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {gatewayTx ? "Credited to Card" : "Pending return drop-off"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Financial & Shipping Badges */}
            {isApproved && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {gatewayTx && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Payment Gateway Refund Ref
                        </div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {gatewayTx}
                        </div>
                      </div>
                    </div>
                    <CopyButton textToCopy={gatewayTx} />
                  </div>
                )}

                {trackingNumber && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          UPS Return Tracking Number
                        </div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {trackingNumber}
                        </div>
                      </div>
                    </div>
                    <CopyButton textToCopy={trackingNumber} />
                  </div>
                )}
              </div>
            )}

            {/* Customer Message & AI Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                  Resolution Findings & Policy Assessment
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Last updated: {ticket.updated_at}
                </span>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">
                {ticket.summary}
              </p>
            </div>
          </div>

          {/* Audit Logs Trail */}
          {auditLogs.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-white shadow-sm bg-white/70 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h4 className="font-black text-sm text-slate-900">
                  Verification History & Forensic Audit Trail
                </h4>
              </div>

              <div className="space-y-2.5">
                {auditLogs.map((log: any, idx: number) => (
                  <div
                    key={log.id || idx}
                    className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {log.details || log.node_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                      {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="glass-panel-elevated p-12 rounded-3xl text-center space-y-3 bg-white/70 border border-white shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            No Ticket Record Selected
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
            Enter your Ticket ID (e.g. <strong>TCK-1001</strong>) above or click one of the recent inquiries to inspect your live refund progress and download shipping labels.
          </p>
        </div>
      )}

      {/* 🏷️ Printable Return Shipping Voucher Barcode Modal */}
      {ticket && (
        <ReturnShippingLabelModal
          isOpen={isLabelModalOpen}
          onClose={() => setIsLabelModalOpen(false)}
          orderId={ticket.order_id || "ORD-1001"}
          customerName="Valued Customer"
          itemTitle="AcmeCommerce Order Item"
          refundAmount={120.0}
          trackingNumber={trackingNumber}
          carrier="UPS Ground"
        />
      )}
    </div>
  );
};
