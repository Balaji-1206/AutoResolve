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
} from "lucide-react";
import { CUSTOMER_PROFILES, CustomerProfile } from "@/lib/customerProfiles";
import { investigateTicket } from "@/lib/api";
import { generateCustomerResponse } from "@/lib/customerResponse";
import { InvestigationResult, ActiveTab } from "@/lib/types";
import { useToast } from "../Toast";
import { CopyButton } from "../CopyButton";

interface CustomerPortalTabProps {
  onSwitchTab: (tab: ActiveTab) => void;
  onNewResult?: (result: InvestigationResult, ticketText: string) => void;
  onSupervisorAlertTriggered?: (result: InvestigationResult, customer: CustomerProfile, message: string) => void;
}

export const CustomerPortalTab: React.FC<CustomerPortalTabProps> = ({
  onSwitchTab,
  onNewResult,
  onSupervisorAlertTriggered,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile>(CUSTOMER_PROFILES[0]);
  const [orderId, setOrderId] = useState<string>(CUSTOMER_PROFILES[0].recentOrderId);
  const [inquiryText, setInquiryText] = useState<string>(
    "Hi, I received my running shoes from order ORD-1001 14 days ago. They don't fit well. Can I exchange or return them?"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [customerResponse, setCustomerResponse] = useState<string>("");
  const toast = useToast();

  const handleSelectProfile = (profile: CustomerProfile) => {
    setSelectedProfile(profile);
    setOrderId(profile.recentOrderId);
    setResult(null);

    // Provide helpful initial inquiry based on profile
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

  const handleRunCustomerResolution = async () => {
    if (!inquiryText.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await investigateTicket(inquiryText, ticketId, orderId);
      const formattedResponse = generateCustomerResponse(res, selectedProfile.name, orderId);

      setResult(res);
      setCustomerResponse(formattedResponse);

      if (onNewResult) {
        onNewResult(res, inquiryText);
      }

      if (res.requires_human_review && onSupervisorAlertTriggered) {
        onSupervisorAlertTriggered(res, selectedProfile, inquiryText);
        toast.warning(
          "Supervisor Alert Dispatched",
          `Order ${orderId} exceeds automated thresholds. Senior Operations Supervisor notified.`
        );
      } else if (res.decision === "ELIGIBLE") {
        toast.success("Resolution Complete", "Your return request has been automatically approved!");
      } else {
        toast.info("Resolution Complete", "Inquiry processed against store policy guidelines.");
      }
    } catch (err: any) {
      toast.error("Resolution Unavailable", err.message || "Failed to reach resolution service.");
    } finally {
      setIsLoading(false);
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
            verifies your delivery records and applies company policies instantly—no waiting for human agents.
          </p>
        </div>

        {/* Customer Profile Switcher Card */}
        <div className="p-4 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm flex flex-col gap-2 min-w-[260px]">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
            <span>Customer Account</span>
            <span className="text-indigo-600 font-bold">Switch Account</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center shadow-md">
              {selectedProfile.avatarInitials}
            </div>
            <div>
              <div className="font-black text-sm text-slate-900 leading-tight">
                {selectedProfile.name}
              </div>
              <div className="text-xs text-slate-500 font-semibold">
                {selectedProfile.customerId} • {selectedProfile.email}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
            {CUSTOMER_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProfile(p)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                  selectedProfile.id === p.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 🌟 2. Quick Issue Topic Pills */}
      <div className="space-y-2">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-1 block">
          Common Order Questions & Requests
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            {
              label: "👟 Return Running Shoes (ORD-1001)",
              orderId: "ORD-1001",
              profileId: "cus-1",
              text: "Hi, I received my running shoes from order ORD-1001 14 days ago. They don't fit well. Can I exchange or return them?",
            },
            {
              label: "📺 Return 4K TV - High Value (ORD-1002)",
              orderId: "ORD-1002",
              profileId: "cus-2",
              text: "I want to return the 4K Ultra HD TV in order ORD-1002. The screen size does not fit my living room stand.",
            },
            {
              label: "🎨 Return Handcrafted Craft (ORD-1005)",
              orderId: "ORD-1005",
              profileId: "cus-3",
              text: "I bought a custom engraved wood craft set in order ORD-1005 and I changed my mind. Please refund it.",
            },
            {
              label: "📦 Damaged Delivery Claim (ORD-1006)",
              orderId: "ORD-1006",
              profileId: "cus-4",
              text: "My order ORD-1006 arrived damaged yesterday and parts are missing. I want a refund right away.",
            },
            {
              label: "🚚 Check Shipping & Tracking Status",
              orderId: "ORD-1001",
              profileId: "cus-1",
              text: "Can you confirm the verified delivery date and carrier status for order ORD-1001?",
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

      {/* 🌟 3. Main Customer Resolution Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Customer Inquiry Input (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
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
              <label className="text-xs font-bold text-slate-700 block mb-1">
                What would you like assistance with?
              </label>
              <textarea
                rows={5}
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder="Explain what happened with your item, delivery, or return request..."
                className="w-full p-4 text-xs sm:text-sm rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 leading-relaxed shadow-sm resize-none"
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
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
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
        </div>

        {/* Right Column: Live Autonomous Customer Resolution (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
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
                          Automated Resolution Success
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
                    Your order {orderId} meets all requirements under our 30-day return policy [POL-REFUND-001]. A full refund of <strong className="text-slate-900 font-bold">${result.operational_evidence?.order?.total_amount?.toFixed(2) || "120.00"}</strong> has been scheduled to your original payment method.
                  </p>

                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-slate-900">
                          Prepaid Return Shipping Label
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Carrier: UPS Ground • Valid for 7 calendar days
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => toast.success("Shipping Label Downloaded", "UPS prepaid return voucher saved.")}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Label</span>
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
                          Secondary Verification Required
                        </span>
                        <h3 className="text-lg font-black text-slate-900">
                          Supervisor Sign-Off in Progress
                        </h3>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs">
                      Under Review
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    Because this transaction total (${result.operational_evidence?.order?.total_amount?.toFixed(2) || "750.00"}) exceeds the $500.00 standard threshold, company policy [POL-REFUND-001] requires a secondary sign-off from our Senior Operations Supervisor.
                  </p>

                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 font-medium space-y-1.5 shadow-sm">
                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Bell className="w-4 h-4 text-amber-600 animate-pulse" />
                      Live Notification Sent to Operations Supervisor
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      A high-priority review alert has been delivered to the supervisor on duty. You will receive an automated email confirmation at <span className="font-bold">{selectedProfile.email}</span> within 2–4 business hours.
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
                          Policy Determination
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
                    {result.reasoning_summary || "This item is classified as non-refundable under catalog policy constraints (POL-REFUND-001)."}
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

              {/* Full Detailed Customer Message Card */}
              <div className="glass-panel-elevated p-5 sm:p-6 rounded-3xl border border-white shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-indigo-600" />
                    Official Customer Care Statement
                  </span>
                  <CopyButton textToCopy={customerResponse} label="Copy Statement" />
                </div>
                <div className="p-4 rounded-2xl bg-white/90 border border-slate-200 text-xs sm:text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap shadow-sm">
                  {customerResponse}
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
    </div>
  );
};
