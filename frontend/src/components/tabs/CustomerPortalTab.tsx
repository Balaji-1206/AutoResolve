"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Download,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  User,
  ExternalLink,
  ChevronRight,
  FileText,
  BadgeCheck,
  Bell,
  RefreshCw,
  Printer,
  MessageSquare,
  CornerDownRight,
  CreditCard,
  Truck,
} from "lucide-react";
import { CUSTOMER_PROFILES, CustomerProfile } from "@/lib/customerProfiles";
import { investigateTicket, fetchSavedTickets, LiveOrder } from "@/lib/api";
import { generateCustomerResponse } from "@/lib/customerResponse";
import { InvestigationResult, ActiveTab, SavedTicket } from "@/lib/types";
import { OrderLookupGateway } from "../OrderLookupGateway";
import { ReturnShippingLabelModal } from "../ReturnShippingLabelModal";
import { useToast } from "../Toast";
import { CopyButton } from "../CopyButton";

interface SupportMessage {
  id: string;
  sender: "customer" | "support";
  text: string;
  timestamp: string;
}

interface CustomerPortalTabProps {
  onSwitchTab: (tab: ActiveTab) => void;
  onNewResult?: (result: InvestigationResult, ticketText: string) => void;
  onSupervisorAlertTriggered?: (result: InvestigationResult, customer: CustomerProfile, message: string) => void;
  initialOrderId?: string;
  initialInquiryText?: string;
}

const DEFAULT_CUSTOMER_INQUIRY = `Customer Name: Aarav Kumar
Email: aarav.kumar@example.com (Account ID: CUS-1001)
Order Number: ORD-1001 (Running Shoes - $120.00)
Inquiry Details: Hi, I received my running shoes from order ORD-1001 14 days ago. They don't fit well and are unworn in their original packaging. Can I return them for a full refund under the 30-day guarantee?`;

export const CustomerPortalTab: React.FC<CustomerPortalTabProps> = ({
  onSwitchTab,
  onNewResult,
  onSupervisorAlertTriggered,
  initialOrderId,
  initialInquiryText,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile>(CUSTOMER_PROFILES[0]);
  const [orderId, setOrderId] = useState<string>(initialOrderId || "ORD-1001");
  const [inquiryText, setInquiryText] = useState<string>(
    initialInquiryText || DEFAULT_CUSTOMER_INQUIRY
  );

  React.useEffect(() => {
    if (initialOrderId) setOrderId(initialOrderId);
    if (initialInquiryText) setInquiryText(initialInquiryText);
  }, [initialOrderId, initialInquiryText]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [customerResponse, setCustomerResponse] = useState<string>("");
  const [isLabelModalOpen, setIsLabelModalOpen] = useState<boolean>(false);

  // 💬 Multi-Turn Conversation Thread
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [followUpText, setFollowUpText] = useState<string>("");
  const [isFollowUpLoading, setIsFollowUpLoading] = useState<boolean>(false);

  // 🗄️ Persistent Database Tickets (SQLite)
  const [savedTickets, setSavedTickets] = useState<SavedTicket[]>([]);

  const loadSavedTickets = async () => {
    try {
      const tickets = await fetchSavedTickets(15);
      setSavedTickets(tickets);
    } catch {
      // Graceful fallback
    }
  };

  React.useEffect(() => {
    loadSavedTickets();
  }, []);

  const toast = useToast();

  // Extract tracking number and refund gateway ID if actions were executed
  const returnLabelAction = result?.actions_taken?.find((a) => a.startsWith("RETURN_LABEL_ISSUED"));
  const trackingMatch = returnLabelAction?.match(/Tracking #([^\)]+)/);
  const executedTrackingNumber = trackingMatch ? trackingMatch[1] : undefined;
  const carrierMatch = returnLabelAction?.match(/Carrier ([^(]+)/);
  const executedCarrier = carrierMatch ? carrierMatch[1].trim() : "UPS Ground";

  const refundAction = result?.actions_taken?.find((a) => a.startsWith("REFUND_EXECUTED"));
  const gatewayMatch = refundAction?.match(/via (tx_[^\)]+)/);
  const executedGatewayTx = gatewayMatch ? gatewayMatch[1] : undefined;

  const handleSelectProfile = (profile: CustomerProfile) => {
    setSelectedProfile(profile);
    setOrderId(profile.recentOrderId);
    setResult(null);
    setMessages([]);

    if (profile.customerId === "CUS-1001") {
      setInquiryText(
        "Hi, I received my running shoes from order ORD-1001 14 days ago. They don't fit well. Can I exchange or return them?"
      );
    } else if (profile.customerId === "CUS-1002") {
      setInquiryText(
        "I want to return the 4K Ultra HD TV in order ORD-1002. The screen size does not fit my living room stand."
      );
    } else if (profile.customerId === "CUS-1005") {
      setInquiryText(
        "I bought a custom engraved wood craft set in order ORD-1005 and I changed my mind. Please refund it."
      );
    } else if (profile.customerId === "CUS-1006") {
      setInquiryText(
        "My order ORD-1006 arrived damaged yesterday and parts are missing. I want a refund right away."
      );
    }

    toast.info("Account Loaded", `Browsing as ${profile.name} (${profile.customerId})`);
  };

  const handleOrderFoundFromGateway = (order: LiveOrder, email?: string) => {
    setOrderId(order.order_id);
    setResult(null);
    setMessages([]);
    setInquiryText(
      `Hello, I would like to inquire about my order ${order.order_id} (${order.product_category || "Item"}). Is it eligible for return or exchange?`
    );
  };

  const handleRunCustomerResolution = async () => {
    if (!inquiryText.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await investigateTicket(inquiryText, ticketId, orderId);
      const formattedResponse = generateCustomerResponse(res, selectedProfile.name, orderId);

      setResult(res);
      setCustomerResponse(formattedResponse);

      // Initialize multi-turn conversation thread
      const initialThread: SupportMessage[] = [
        {
          id: `msg-cus-${Date.now()}`,
          sender: "customer",
          text: inquiryText,
          timestamp: "Just now",
        },
        {
          id: `msg-sup-${Date.now() + 1}`,
          sender: "support",
          text: formattedResponse,
          timestamp: "Just now",
        },
      ];
      setMessages(initialThread);

      if (onNewResult) {
        onNewResult(res, inquiryText);
      }

      if (res.requires_human_review && onSupervisorAlertTriggered) {
        onSupervisorAlertTriggered(res, selectedProfile, inquiryText);
        toast.warning(
          "Manager Review Requested",
          `Order ${orderId} exceeds standard automated limit. Notification sent to store management.`
        );
      } else if (res.decision === "ELIGIBLE") {
        toast.success("Resolution Complete", "Your return request has been automatically approved!");
      } else {
        toast.info("Resolution Complete", "Inquiry processed against store policy guidelines.");
      }

      // Refresh persistent ticket records from SQLite
      loadSavedTickets();
    } catch (err: any) {
      toast.error("Resolution Unavailable", err.message || "Failed to reach resolution service.");
    } finally {
      setIsLoading(false);
    }
  };

  // 💬 Multi-Turn Follow-Up Query Handler
  const handleSendFollowUp = async (customPrompt?: string) => {
    const textToSend = (customPrompt || followUpText).trim();
    if (!textToSend || isFollowUpLoading) return;

    const userMsg: SupportMessage = {
      id: `msg-cus-${Date.now()}`,
      sender: "customer",
      text: textToSend,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setFollowUpText("");
    setIsFollowUpLoading(true);

    try {
      const followUpPrompt = `Context: Order ${orderId}. Previous resolution was: ${result?.decision || "INQUIRY"}. Customer asks follow-up: "${textToSend}"`;
      const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await investigateTicket(followUpPrompt, ticketId, orderId);
      const botResponse = generateCustomerResponse(res, selectedProfile.name, orderId);

      const supportMsg: SupportMessage = {
        id: `msg-sup-${Date.now()}`,
        sender: "support",
        text: botResponse,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, supportMsg]);
      toast.info("Response Received", "AcmeCommerce Customer Care replied.");
    } catch (err: any) {
      toast.error("Could not process follow-up", err.message || "Failed to contact care service.");
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleQuickIssue = (
    presetOrderId: string,
    text: string,
    profileId?: string
  ) => {
    if (profileId) {
      const match = CUSTOMER_PROFILES.find((p) => p.id === profileId);
      if (match) setSelectedProfile(match);
    }
    setOrderId(presetOrderId);
    setInquiryText(text);
    setResult(null);
    setMessages([]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 🌟 1. Customer Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl flex flex-wrap items-center justify-between gap-6"
      >
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              24/7 Autonomous Resolution Service
            </span>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">•</span>
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              Instant Return & Refund Self-Service
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How can we help with your order today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Get instant, automated solutions for your AcmeCommerce orders. Our intelligent resolution system
            verifies your delivery records and applies store policies instantly—no waiting on hold.
          </p>
        </div>
      </motion.div>

      {/* 🌟 2. Order Lookup & Customer Gateway */}
      <OrderLookupGateway
        onOrderFound={handleOrderFoundFromGateway}
      />

      {/* 🌟 Quick Ticket Tracking Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-purple-50/90 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-950 font-medium">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>Already submitted a return request? Check live approval, return tracking, and print labels.</span>
        </div>
        <button
          onClick={() => onSwitchTab("track")}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-black shadow-xs transition-all flex items-center gap-1.5 flex-shrink-0"
        >
          <span>Track Ticket Status</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 🌟 3. Quick Issue Topic Pills */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 block">
          Common Order Questions & Requests
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "👟 Return Shoes (Aarav Kumar • ORD-1001)",
              orderId: "ORD-1001",
              profileId: "cus-1",
              text: `Customer Name: Aarav Kumar\nEmail: aarav.kumar@example.com (Account ID: CUS-1001)\nOrder Number: ORD-1001 (Running Shoes - $120.00)\nInquiry Details: Hi, I received my running shoes from order ORD-1001 14 days ago. They don't fit well and are unworn in their original packaging. Can I return them for a full refund under the 30-day guarantee?`,
            },
            {
              label: "📺 Return 4K TV > $500 (Priya Sharma • ORD-1002)",
              orderId: "ORD-1002",
              profileId: "cus-2",
              text: `Customer Name: Priya Sharma\nEmail: priya.sharma@example.com (Account ID: CUS-1002)\nOrder Number: ORD-1002 (4K Ultra HD TV - $1,299.99)\nInquiry Details: I want to return the 4K Ultra HD TV in order ORD-1002. The screen size does not fit my living room stand. I have all original cables and the box.`,
            },
            {
              label: "🎨 Final Sale Craft (Rohan Gupta • ORD-1005)",
              orderId: "ORD-1005",
              profileId: "cus-3",
              text: `Customer Name: Rohan Gupta\nEmail: rohan.gupta@example.com (Account ID: CUS-1005)\nOrder Number: ORD-1005 (Handcrafted Wooden Craft - $45.00)\nInquiry Details: I bought a custom engraved wood craft set in order ORD-1005 and I changed my mind. Please refund it to my original payment card.`,
            },
            {
              label: "📦 Damaged Delivery Claim (Neha Patel • ORD-1006)",
              orderId: "ORD-1006",
              profileId: "cus-4",
              text: `Customer Name: Neha Patel\nEmail: neha.patel@example.com (Account ID: CUS-1006)\nOrder Number: ORD-1006 (Kitchen Cookware Set - $185.00)\nInquiry Details: My order ORD-1006 arrived yesterday with a cracked glass lid and missing handles. I want a replacement or an immediate refund.`,
            },
          ].map((topic, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuickIssue(topic.orderId, topic.text, topic.profileId)}
              className="text-xs px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-700 font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{topic.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 🌟 4. Main Customer Resolution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Customer Inquiry Input (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Describe Your Order Request
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">
                Instant Automated Check
              </span>
            </div>

            {/* Order ID Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Order Number (ORD-XXXX)
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. ORD-1001"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none font-bold text-slate-900 shadow-sm"
                />
              </div>
            </div>

            {/* Inquiry Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  What would you like assistance with?
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderId("ORD-1001");
                      setInquiryText(DEFAULT_CUSTOMER_INQUIRY);
                      toast.info("Default Info Loaded", "Pre-filled customer info (Aarav Kumar • ORD-1001)");
                    }}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Reset Default Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryText("")}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="Explain what happened with your item, delivery, or return request..."
                className="w-full p-3.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 leading-relaxed shadow-sm resize-none font-mono"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified with AcmeCommerce Policies</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRunCustomerResolution}
                disabled={isLoading || !inquiryText.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Order Records & Policy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Resolve My Issue Instantly</span>
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Customer's Selected Order Context Card */}
          <div className="glass-panel p-5 rounded-2xl border border-white/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Active Order on Record
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                Verified Carrier Delivery
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-black text-sm text-slate-900">{orderId}</div>
                <div className="text-xs text-slate-600 font-medium">{selectedProfile.recentOrderTitle}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-sm text-slate-900">${selectedProfile.orderAmount.toFixed(2)}</div>
                <div className="text-[11px] text-slate-400 font-semibold">{selectedProfile.deliveryDate}</div>
              </div>
            </div>
          </div>

          {/* 🗄️ Persistent Database Tickets (SQLite) */}
          <div className="glass-panel p-5 rounded-2xl border border-white/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-black text-xs text-slate-900 tracking-tight">
                  Inquiry History on Record
                </span>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                SQLite WAL Mode
              </span>
            </div>

            {savedTickets.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 font-medium">
                No past inquiries recorded in database yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedTickets.map((t) => (
                  <div
                    key={t.ticket_id}
                    onClick={() => {
                      if (t.order_id) setOrderId(t.order_id);
                      setInquiryText(t.customer_message);
                      toast.info("Ticket Loaded", `Reviewing ${t.ticket_id}`);
                    }}
                    className="p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/70 border border-slate-200/60 hover:border-indigo-200 transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-black text-slate-900">
                        <span>{t.ticket_id}</span>
                        {t.order_id && (
                          <span className="text-slate-400 font-semibold text-[10px]">
                            • {t.order_id}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider ${
                          t.decision === "ELIGIBLE"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.decision === "INELIGIBLE"
                            ? "bg-rose-100 text-rose-800"
                            : t.decision === "NEEDS_HUMAN_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.decision.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
                      {t.summary || t.customer_message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-0.5">
                      <span>{t.created_at}</span>
                      <span className="text-indigo-600 group-hover:underline">Load to review &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Resolution & Multi-Turn Dialogue (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Decision Outcome Card */}
              {result.decision === "ELIGIBLE" && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-2 border-emerald-300 shadow-xl space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                          Automated Resolution Complete
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          Return Request Approved
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs">
                      Instant Approval
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    Your order {orderId} meets all requirements under our standard 30-day return policy. A full refund of <strong className="text-slate-900 font-bold">${result.operational_evidence?.order?.total_amount?.toFixed(2) || "120.00"}</strong> has been scheduled to your original payment method.
                  </p>

                  {/* ⚡ Automated Action Execution Status */}
                  {result.actions_taken && result.actions_taken.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                            Authoritative Write Actions Executed
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                          Database State Mutated
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {executedGatewayTx && (
                          <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 flex items-center justify-between gap-2 shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-500 truncate">GATEWAY REFUND TX</div>
                                <div className="font-mono font-bold text-[11px] text-slate-800 truncate">{executedGatewayTx}</div>
                              </div>
                            </div>
                            <CopyButton textToCopy={executedGatewayTx} />
                          </div>
                        )}

                        {executedTrackingNumber && (
                          <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 flex items-center justify-between gap-2 shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-slate-500 truncate">CARRIER TRACKING #</div>
                                <div className="font-mono font-bold text-[11px] text-slate-800 truncate">{executedTrackingNumber}</div>
                              </div>
                            </div>
                            <CopyButton textToCopy={executedTrackingNumber} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900">
                          Prepaid Return Shipping Voucher
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Carrier: {executedCarrier} • Valid for 7 calendar days
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsLabelModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View & Print Label</span>
                    </button>
                  </div>
                </div>
              )}

              {result.decision === "NEEDS_HUMAN_REVIEW" && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border-2 border-amber-300 shadow-xl space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <AlertTriangle className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">
                          Store Manager Review
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          Manager Review in Progress
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                      Under Review
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    Because this transaction total (${result.operational_evidence?.order?.total_amount?.toFixed(2) || "750.00"}) exceeds our $500.00 standard threshold, store policy requires a quick sign-off from our Customer Care Manager.
                  </p>

                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 font-medium space-y-1.5 shadow-sm">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
                      Notification Sent to Store Manager
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      A review notification has been delivered to the store manager on duty. You will receive an automated email confirmation at <span className="font-bold">{selectedProfile.email}</span> within 2–4 business hours.
                    </p>
                  </div>
                </div>
              )}

              {result.decision === "INELIGIBLE" && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-white border-2 border-rose-300 shadow-xl space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
                        <XCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
                          Store Policy Guidelines
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          Return Not Eligible
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-extrabold text-xs">
                      Policy Exceeded
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {result.reasoning_summary?.replace(/\[POL-[A-Z0-9-]+\]/g, "")?.replace(/\(POL-[A-Z0-9-]+\)/g, "") || "This item is classified as non-refundable under our published store return policy."}
                  </p>

                  <div className="p-4 rounded-2xl bg-white border border-rose-200 text-xs text-slate-600 font-normal space-y-1 shadow-sm">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Need Further Assistance?
                    </span>
                    <p>
                      If you feel this decision was reached in error or your package arrived damaged, please visit our Help Center or reply with photo evidence for an exception review.
                    </p>
                  </div>
                </div>
              )}

              {/* 💬 5. Multi-Turn Interactive Support Conversation Timeline */}
              <div className="glass-panel-elevated p-5 sm:p-6 rounded-3xl border border-white shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    Support Conversation Timeline
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">
                    Interactive Care Concierge
                  </span>
                </div>

                {/* Messages List */}
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${
                        msg.sender === "customer" ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">
                          {msg.sender === "customer" ? selectedProfile.name : "AcmeCommerce Customer Care"}
                        </span>
                        <span className="text-[10px] text-slate-300">•</span>
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[90%] whitespace-pre-wrap shadow-sm ${
                          msg.sender === "customer"
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm font-sans"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {isFollowUpLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-bold w-fit animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>Customer Care Assistant is replying...</span>
                    </div>
                  )}
                </div>

                {/* Quick Follow-up Question Chips */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Suggested Follow-Up Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Where is the nearest UPS drop-off location?",
                      "How long until my refund settles to my card?",
                      "Can I exchange for another size instead of refund?",
                      "What if I already opened the packaging?",
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendFollowUp(suggestion)}
                        disabled={isFollowUpLoading}
                        className="text-[11px] px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 font-semibold transition-colors border border-slate-200/60 disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Follow-Up Text Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendFollowUp();
                      }
                    }}
                    placeholder="Type a follow-up question or clarification..."
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-medium text-slate-900 shadow-sm"
                  />
                  <button
                    onClick={() => handleSendFollowUp()}
                    disabled={isFollowUpLoading || !followUpText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel-elevated p-10 sm:p-12 rounded-3xl text-center space-y-4 border border-white shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Instant Automated Resolution Ready
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                Click <strong>"Resolve My Issue Instantly"</strong> to evaluate your order against store policies, check delivery timestamps, and receive an automated resolution in under a second.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🏷️ Printable Return Shipping Voucher & Barcode Modal */}
      <ReturnShippingLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        orderId={orderId}
        customerName={selectedProfile.name}
        itemTitle={selectedProfile.recentOrderTitle}
        refundAmount={result?.operational_evidence?.order?.total_amount || selectedProfile.orderAmount}
        trackingNumber={executedTrackingNumber}
        carrier={executedCarrier}
      />
    </div>
  );
};
