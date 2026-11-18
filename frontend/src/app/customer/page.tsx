"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Header } from "@/components/Header";
import { TabsNavigation } from "@/components/TabsNavigation";
import { CustomerPortalTab } from "@/components/tabs/CustomerPortalTab";
import { CustomerOrdersTab } from "@/components/tabs/CustomerOrdersTab";
import { SystemTab } from "@/components/tabs/SystemTab";
import { TrackTicketTab } from "@/components/tabs/TrackTicketTab";
import { ToastProvider } from "@/components/Toast";
import { ActiveTab, InvestigationResult } from "@/lib/types";
import { ArrowLeft, ShieldCheck, ShoppingBag } from "lucide-react";

export default function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("concierge");
  const [conciergeOrderId, setConciergeOrderId] = useState<string>("");
  const [conciergeInquiryText, setConciergeInquiryText] = useState<string>("");

  return (
    <ToastProvider>
      <main className="relative min-h-screen flex flex-col justify-between overflow-hidden mesh-subtle-overlay selection:bg-indigo-100 selection:text-indigo-900">
        {/* 🌟 1. Ambient Floating Glow Orbs in Background (Apple iOS Fluid Visuals) */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 40, -30, 0],
              y: [0, -50, 25, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-indigo-400/20 via-purple-300/15 to-transparent blur-3xl"
          />

          <motion.div
            animate={{
              x: [0, -45, 35, 0],
              y: [0, 55, -25, 0],
              scale: [1, 1.2, 0.95, 1],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -right-36 w-[36rem] h-[36rem] rounded-full bg-gradient-to-bl from-sky-300/20 via-teal-200/15 to-transparent blur-3xl"
          />

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
          {/* Customer Store Header (Pure Shopper View - Zero Staff UI) */}
          <Header />

          {/* Customer Portal Navigation Tabs */}
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Active Customer View with Smooth Fluid Transitions */}
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

              {activeTab === "track" && (
                <motion.div
                  key="track"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <TrackTicketTab
                    initialTicketId={conciergeOrderId ? `TCK-${conciergeOrderId.replace("ORD-", "")}` : "TCK-1001"}
                    onNavigateToConcierge={() => setActiveTab("concierge")}
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
            </AnimatePresence>
          </div>
        </div>

        {/* 🌟 3. Clean Customer Footer with Portal Navigation */}
        <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-xl mt-16">
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
              <Link
                href="/"
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors font-bold text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Portal</span>
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </ToastProvider>
  );
}
