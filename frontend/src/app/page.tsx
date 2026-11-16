"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { TabsNavigation } from "@/components/TabsNavigation";
import { PlaygroundTab } from "@/components/tabs/PlaygroundTab";
import { VisualTraceTab } from "@/components/tabs/VisualTraceTab";
import { SupervisorTab } from "@/components/tabs/SupervisorTab";
import { SystemTab } from "@/components/tabs/SystemTab";
import { ToastProvider } from "@/components/Toast";
import { ActiveTab, InvestigationResult } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("playground");
  const [lastResult, setLastResult] = useState<InvestigationResult | null>(null);
  const [lastTicketText, setLastTicketText] = useState<string>("");

  const handleNewResult = (result: InvestigationResult, text: string) => {
    setLastResult(result);
    setLastTicketText(text);
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
          {/* Navigation Bar */}
          <Header />

          {/* Segmented Navigation Tabs */}
          <TabsNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingReviewCount={lastResult?.requires_human_review ? 1 : 1}
          />

          {/* Active Tab Content with Smooth Transitions */}
          <div className="relative w-full flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "playground" && (
                <motion.div
                  key="playground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <PlaygroundTab
                    onSwitchTab={setActiveTab}
                    onNewResult={handleNewResult}
                  />
                </motion.div>
              )}

              {activeTab === "visualizer" && (
                <motion.div
                  key="visualizer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <VisualTraceTab
                    lastResult={lastResult}
                    lastTicketText={lastTicketText}
                  />
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
                  <SupervisorTab />
                </motion.div>
              )}

              {activeTab === "system" && (
                <motion.div
                  key="system"
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

        {/* 🌟 3. Executive Footer */}
        <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/50 backdrop-blur-md mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-500 font-semibold gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight">AutoResolve AI</span>
              <span className="text-slate-300">•</span>
              <span>Autonomous Customer Operations & Grounded Resolution</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Enterprise Engine
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-500 text-xs">FastAPI Microservices (8000, 8001, 8002)</span>
            </div>
          </div>
        </footer>
      </main>
    </ToastProvider>
  );
}
