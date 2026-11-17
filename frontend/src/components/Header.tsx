"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Cpu, Activity, Bell, ShoppingBag } from "lucide-react";
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
      className="sticky top-0 z-50 w-full glass-panel-elevated border-b border-white/90 backdrop-blur-xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Customer Store Brand Group */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/95 flex-shrink-0"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                AcmeCommerce
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm leading-tight">
                Customer Care
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide mt-0.5 hidden sm:block">
              Autonomous Order & Return Resolution • Powered by AutoResolve AI
            </p>
          </div>
        </div>

        {/* Status Indicators & Supervisor Alert Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Health Status Pill */}
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-700 shadow-sm border border-white">
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
            <span className="text-slate-800 hidden sm:inline">
              {onlineCount === 3
                ? "24/7 Automated Service Active"
                : onlineCount > 0
                ? `${onlineCount}/3 Services Live`
                : "Automated Service Ready"}
            </span>
            <span className="text-slate-800 sm:hidden">24/7 Live</span>
          </div>

          {/* Supervisor Notification Button (Human-in-the-Loop) */}
          {supervisorAlertCount > 0 ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenSupervisorModal}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-3.5 h-3.5 animate-bounce" />
              <span>Supervisor Alert ({supervisorAlertCount})</span>
            </motion.button>
          ) : (
            <button
              onClick={onOpenSupervisorModal}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              title="Supervisor Alert Center (Triggers when autonomous limits are exceeded)"
            >
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Supervisor Alerts (0)</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

