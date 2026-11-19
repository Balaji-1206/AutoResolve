"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ShieldCheck, Cpu, Activity, Bell, ShoppingBag, ArrowLeft } from "lucide-react";
import { fetchAllServiceHealth } from "@/lib/api";
import { ServiceHealth } from "@/lib/types";

interface HeaderProps {
  supervisorAlertCount?: number;
  onOpenSupervisorModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  supervisorAlertCount = 0,
  onOpenSupervisorModal,
}) => {
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
      className="sticky top-0 z-50 w-full ios-glass-elevated border-b border-white/90 backdrop-blur-3xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Customer Store Brand Group */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer" title="Return to Gateway Selector">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-10 h-10 rounded-[1.1rem] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/95 flex-shrink-0"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                AcmeCommerce
              </span>
              <span className="ios-pill px-2.5 py-0.5 text-[10px] font-black bg-emerald-50/90 text-emerald-800 border-emerald-200">
                Customer Care
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5 hidden sm:block">
              24/7 Automated Order & Return Resolution
            </p>
          </div>
        </Link>

        {/* Dynamic Island Style Status Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="ios-pill px-3.5 py-1.5 flex items-center gap-2 text-xs font-bold text-slate-700 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-800 hidden sm:inline">
              {onlineCount > 0 ? "24/7 Automated Support Online" : "Automated Support Ready"}
            </span>
            <span className="text-slate-800 sm:hidden">24/7 Live</span>
          </div>

          <Link
            href="/"
            className="ios-pill px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/90 flex items-center gap-1.5 transition-all"
            title="Switch portal view"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal Selector</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
