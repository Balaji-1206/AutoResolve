"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Cpu, Activity } from "lucide-react";
import { fetchAllServiceHealth } from "@/lib/api";
import { ServiceHealth } from "@/lib/types";

export const Header: React.FC = () => {
  const [health, setHealth] = useState<ServiceHealth[]>([]);

  useEffect(() => {
    fetchAllServiceHealth().then(setHealth);
    const interval = setInterval(() => {
      fetchAllServiceHealth().then(setHealth);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = health.filter((h) => h.status === "online").length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 w-full glass-panel-elevated border-b border-white/90 backdrop-blur-xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Identity Group */}
        <div className="flex items-center gap-3.5">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/95 flex-shrink-0"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                AutoResolve<span className="text-indigo-600">.AI</span>
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-black rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-sm leading-tight">
                Enterprise v4.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold tracking-wide mt-1 hidden sm:block">
              Autonomous Customer Support & Intelligent Resolution Platform
            </p>
          </div>
        </div>

        {/* Live System Indicators */}
        <div className="flex items-center gap-2.5">
          {/* Main Health Status Pill */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-pill px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-700 shadow-sm border border-white"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  onlineCount > 0 ? "bg-emerald-400" : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  onlineCount > 0 ? "bg-emerald-500" : "bg-emerald-500"
                }`}
              />
            </span>
            <span className="text-slate-800">
              {onlineCount === 3
                ? "All 3 Services Active"
                : onlineCount > 0
                ? `${onlineCount}/3 Services Online`
                : "Simulation Demo Ready"}
            </span>
          </motion.div>

          {/* Model Badge (Desktop) */}
          <div className="glass-pill px-3 py-1.5 rounded-full hidden md:flex items-center gap-2 text-xs font-bold text-slate-700 border border-white">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Qwen3 8B Neural Engine</span>
          </div>

          {/* Shield Badge (Desktop) */}
          <div className="glass-pill px-3 py-1.5 rounded-full hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-white">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Adversarial Shield</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
