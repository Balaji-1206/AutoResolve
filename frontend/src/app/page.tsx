"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { TabsNavigation } from "@/components/TabsNavigation";
import { CustomerPortalTab } from "@/components/tabs/CustomerPortalTab";
import { CustomerOrdersTab } from "@/components/tabs/CustomerOrdersTab";
import { SystemTab } from "@/components/tabs/SystemTab";
import { SupervisorTab } from "@/components/tabs/SupervisorTab";
import { SupervisorNotificationModal } from "@/components/SupervisorNotificationModal";
import { ToastProvider } from "@/components/Toast";
import { ActiveTab, InvestigationResult, PendingCase } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("concierge");
  const [lastResult, setLastResult] = useState<InvestigationResult | null>(null);
  const [lastTicketText, setLastTicketText] = useState<string>("");
  const [supervisorCases, setSupervisorCases] = useState<PendingCase[]>([]);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState<boolean>(false);
  const [conciergeOrderId, setConciergeOrderId] = useState<string>("");
  const [conciergeInquiryText, setConciergeInquiryText] = useState<string>("");

  const handleNewResult = (result: InvestigationResult, text: string) => {
    setLastResult(result);
    setLastTicketText(text);

    // If the live investigation requires human supervisor review, automatically queue notification
    if (result.requires_human_review) {
      setSupervisorCases((prev) => {
        const ticketKey = result.ticket_id || "TCK-REVIEW";
        if (prev.some((c) => c.ticketId === ticketKey && c.status === "pending")) {
          return prev;
        }

        const newCase: PendingCase = {
          id: `case-${Date.now()}`,
          ticketId: ticketKey,
          orderId: (result.operational_evidence?.order?.order_id as string) || "N/A",
          customerName:
            (result.operational_evidence?.customer?.name as string) ||
            ((result.operational_evidence?.customer?.customer_id as string)
              ? `Customer (${result.operational_evidence?.customer?.customer_id})`
              : "Customer Inquiry"),
          orderAmount:
            typeof result.operational_evidence?.order?.total_amount === "number"
              ? result.operational_evidence.order.total_amount
              : 0,
          customerMessage: text,
          reasonForReview:
            result.review_reasons?.length > 0
              ? result.review_reasons.join("; ")
              : result.reasoning_summary,
          timestamp: "Just now",
          status: "pending",
        };

        return [newCase, ...prev];
      });
    }
  };



  return (
    <ToastProvider>
      <main className="relative min-h-screen flex flex-col justify-between overflow-hidden mesh-subtle-overlay selection:bg-indigo-100 selection:text-indigo-900">
        {/* 🌟 1. Ambient Floating Glow Orbs in Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Indigo / Purple Orb */}
          <motion.div
            animate={{
              x: [0, 40, -30, 0],
              y: [0, -50, 25, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-indigo-400/20 via-purple-300/15 to-transparent blur-3xl"
          />

          {/* Sky / Cyan Orb */}
          <motion.div
            animate={{
              x: [0, -45, 35, 0],
              y: [0, 55, -25, 0],
              scale: [1, 1.2, 0.95, 1],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -right-36 w-[36rem] h-[36rem] rounded-full bg-gradient-to-bl from-sky-300/20 via-teal-200/15 to-transparent blur-3xl"
          />

          {/* Amber / Warm Orb */}
          <motion.div
            animate={{
              x: [0, 30, -40, 0],
              y: [0, -40, 50, 0],
              scale: [1, 1.1, 0.92, 1],
            }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/3 left-1/4 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tr from-amber-200/15 via-rose-200/12 to-transparent blur-3xl"
          />

          {/* Emerald Glow Orb */}
          <motion.div
            animate={{
              x: [0, -30, 20, 0],
              y: [0, 40, -40, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-28 right-1/4 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tl from-emerald-300/15 via-emerald-100/10 to-transparent blur-3xl"
          />
        </div>

        {/* 🌟 2. Main Foreground Layer */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Customer Store Header */}
          <Header
            supervisorAlertCount={supervisorCases.filter((c) => c.status === "pending").length}
            onOpenSupervisorModal={() => setIsSupervisorModalOpen(true)}
          />

          {/* Customer Portal Navigation Tabs */}
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingReviewCount={supervisorCases.filter((c) => c.status === "pending").length}
          />

          {/* Active Customer View with Smooth Transitions */}
          <div className="relative w-full flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {(activeTab === "concierge" || activeTab === "playground") && (
                <motion.div
                  key="concierge"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <CustomerPortalTab
                    onSwitchTab={setActiveTab}
                    onNewResult={handleNewResult}
                    initialOrderId={conciergeOrderId}
                    initialInquiryText={conciergeInquiryText}
                  />
                </motion.div>
              )}

              {activeTab === "orders" && (
                <motion.div
                  key="orders"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <CustomerOrdersTab
                    onSelectOrderForResolution={(ordId, text) => {
                      setConciergeOrderId(ordId);
                      setConciergeInquiryText(text);
                      setActiveTab("concierge");
                    }}
                  />
                </motion.div>
              )}

              {(activeTab === "policies" || activeTab === "system") && (
                <motion.div
                  key="policies"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <SystemTab />
                </motion.div>
              )}

              {activeTab === "supervisor" && (
                <motion.div
                  key="supervisor"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <SupervisorTab
                    cases={supervisorCases}
                    setCases={setSupervisorCases}
                    onNavigateToPlayground={() => setActiveTab("concierge")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Supervisor Alert Modal (Human-in-the-Loop Notification) */}
        <SupervisorNotificationModal
          isOpen={isSupervisorModalOpen}
          onClose={() => setIsSupervisorModalOpen(false)}
          cases={supervisorCases}
          setCases={setSupervisorCases}
        />


        {/* 🌟 3. Clean Customer Footer */}
        <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/50 backdrop-blur-md mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight">AcmeCommerce</span>
              <span className="text-slate-300">•</span>
              <span>24/7 Automated Customer Care & Resolution Service</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Automated Service Online
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <button
                onClick={() => setIsSupervisorModalOpen(true)}
                className="text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold cursor-pointer"
                title="Review orders requiring manager sign-off"
              >
                Store Management Reviews {supervisorCases.filter((c) => c.status === "pending").length > 0 && `(${supervisorCases.filter((c) => c.status === "pending").length})`}
              </button>
            </div>
          </div>
        </footer>
      </main>
    </ToastProvider>
  );
}
