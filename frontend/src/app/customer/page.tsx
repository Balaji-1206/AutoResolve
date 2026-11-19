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
import { ActiveTab } from "@/lib/types";
import { ArrowLeft, ShieldCheck, ShoppingBag } from "lucide-react";
import { LaminarFlowBackground } from "@/components/LaminarFlowBackground";

export default function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("concierge");
  const [conciergeOrderId, setConciergeOrderId] = useState<string>("");
  const [conciergeInquiryText, setConciergeInquiryText] = useState<string>("");

  return (
    <ToastProvider>
      <main className="relative min-h-screen flex flex-col justify-between overflow-hidden mesh-subtle-overlay selection:bg-indigo-100 selection:text-indigo-900">
        {/* 🌊 1. Apple iOS Laminar Flow Streamline Background */}
        <LaminarFlowBackground variant="customer" />

        {/* 🍎 2. Main Foreground Layer */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Customer Store Header (Pure Shopper View - Zero Staff UI) */}
          <Header />

          {/* VisionOS Floating Glass Navigation Tabs */}
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Active Customer View with Smooth Laminar Flow Transitions */}
          <div className="relative w-full flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {(activeTab === "concierge" || activeTab === "playground") && (
                <motion.div
                  key="concierge"
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
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
                  initial={{ opacity: 0, y: 12, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.995 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SystemTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 🍎 3. Apple-Style Clean Customer Footer */}
        <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-2xl mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight">AcmeCommerce</span>
              <span className="text-slate-300">•</span>
              <span>24/7 Automated Customer Care & Resolution Service</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="ios-pill px-3 py-1 flex items-center gap-2 text-emerald-800 text-xs font-bold bg-emerald-50/90 border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Automated Service Online
              </span>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors font-bold text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Portal Selector</span>
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </ToastProvider>
  );
}
