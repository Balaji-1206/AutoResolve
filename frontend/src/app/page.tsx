"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Bell,
  CheckCircle2,
  Lock,
  ExternalLink,
  Layers,
  Activity,
  Cpu,
} from "lucide-react";
import { fetchAdminPendingReviews, fetchAllServiceHealth } from "@/lib/api";
import { ServiceHealth } from "@/lib/types";
import { LaminarFlowBackground } from "@/components/LaminarFlowBackground";

export default function GatewayPage() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [health, setHealth] = useState<ServiceHealth[]>([]);

  useEffect(() => {
    fetchAdminPendingReviews(20)
      .then((reviews) => {
        setPendingCount(reviews.length);
      })
      .catch(() => {});

    fetchAllServiceHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  const onlineServicesCount = health.filter((h) => h.status === "online").length;

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-hidden mesh-subtle-overlay selection:bg-indigo-100 selection:text-indigo-900">
      {/* 🌊 1. Apple iOS Laminar Flow Streamline Background */}
      <LaminarFlowBackground variant="gateway" />

      {/* 🍎 2. Apple iOS Liquid Frosted Navigation Header */}
      <header className="relative z-10 w-full border-b border-white/80 bg-white/60 backdrop-blur-3xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-10 h-10 rounded-[1.1rem] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-2 ring-white/95"
            >
              <ShoppingBag className="w-5 h-5" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  AcmeCommerce
                </span>
                <span className="ios-pill px-2.5 py-0.5 text-[10px] font-black text-indigo-700 bg-indigo-50/80 border-indigo-200">
                  AI Multi-Agent
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold tracking-wide">
                AutoResolve Autonomous Support & Human-in-the-Loop Gateway
              </p>
            </div>
          </div>

          {/* Dynamic Island Style Status Pill */}
          <div className="flex items-center gap-3">
            <div className="ios-pill px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>
                {onlineServicesCount > 0 ? "3 Microservices Online" : "System Operational"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 🍎 3. Hero & Apple Fluid Laminar Portal Selector */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-white/90 shadow-sm text-xs font-extrabold text-indigo-950 backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: "8s" }} />
            <span>Select Your Interface to Continue</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Intelligent Resolution.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
              Zero Friction.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Experience laminar automated customer support. Shoppers resolve inquiries instantly with zero administrative noise, while store supervisors retain full policy oversight.
          </p>
        </motion.div>

        {/* 🍎 4. Dual Apple iOS Glassmorphic Squircle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Customer Portal */}
          <motion.div
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="group relative"
          >
            {/* Subtle laminar ambient glow behind squircle */}
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative h-full ios-glass-elevated p-8 sm:p-10 rounded-[2.5rem] border border-white/90 flex flex-col justify-between space-y-8 overflow-hidden">
              {/* Specular sheen sweep effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transform -skew-x-12" />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/90">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <span className="ios-pill px-3.5 py-1 text-xs font-black bg-indigo-50/90 text-indigo-700 border-indigo-200">
                    Shopper View
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    Customer Care Portal
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                    Designed exclusively for shoppers. Instant automated return authorizations, order lookups, and policy-backed refund dispatch with zero administrative clutter.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Instant return authorization in under 1 second</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Automatic prepaid UPS shipping labels & barcodes</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Clean shopper interface with zero employee jargon</span>
                  </div>
                </div>
              </div>

              <Link
                href="/customer"
                className="relative z-10 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 group-hover:shadow-indigo-500/40 transition-all border border-indigo-400/30"
              >
                <span>Enter Customer Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Operations Admin Console */}
          <motion.div
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-rose-500/5 to-transparent rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative h-full ios-glass-elevated p-8 sm:p-10 rounded-[2.5rem] border border-white/90 flex flex-col justify-between space-y-8 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transform -skew-x-12" />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/90">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                      <span className="ios-pill px-3 py-1 text-xs font-black bg-amber-100/90 text-amber-800 border-amber-300 animate-pulse flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {pendingCount} Pending Review{pendingCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="ios-pill px-3.5 py-1 text-xs font-black bg-amber-50/90 text-amber-800 border-amber-200">
                      Operations Staff
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
                    Operations Admin Console
                  </h2>
                  <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                    Dedicated command center for store managers. Inspect high-value policy escalations, trigger one-click financial write overrides, and monitor live Slack alerts.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Durable human review queue persisted in SQLite</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>One-click exception approval & gateway refund dispatch</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Asynchronous HITL notification logs (Slack / Webhooks)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/admin"
                className="relative z-10 w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-700 text-white font-black text-sm sm:text-base shadow-xl shadow-slate-950/20 flex items-center justify-center gap-2 group-hover:shadow-slate-950/30 transition-all border border-slate-700/40"
              >
                <span>Open Operations Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 🍎 5. Apple iOS Liquid Frosted Footer */}
      <footer className="relative z-10 w-full border-t border-white/80 bg-white/50 backdrop-blur-2xl py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between text-xs text-slate-500 font-semibold gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">AutoResolve AI</span>
            <span>•</span>
            <span>Next-Generation Multi-Agent Customer Support Microservices</span>
          </div>
          <div>
            <span className="ios-pill px-3 py-1 bg-white/80 text-slate-600">
              No authentication required in development MVP mode
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
