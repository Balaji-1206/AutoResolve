"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Package, BookOpen, SearchCheck } from "lucide-react";
import { ActiveTab } from "@/lib/types";

interface TabsNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingReviewCount?: number;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: number;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingReviewCount = 0,
}) => {
  const tabs: TabItem[] = [
    {
      id: "concierge" as ActiveTab,
      label: "Instant Help & Returns",
      icon: Sparkles,
      description: "Automated Order & Return Assistant",
    },
    {
      id: "orders" as ActiveTab,
      label: "My Orders & Tracking",
      icon: Package,
      description: "Delivery Status & Return Windows",
    },
    {
      id: "track" as ActiveTab,
      label: "Track My Request",
      icon: SearchCheck,
      description: "Lookup Ticket & Refund Progress",
    },
    {
      id: "policies" as ActiveTab,
      label: "Store Policies & FAQs",
      icon: BookOpen,
      description: "30-Day Guarantees & Guidelines",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <motion.nav
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="ios-glass p-2 rounded-[2rem] grid grid-cols-2 lg:grid-cols-4 gap-2 shadow-sm border border-white/90 backdrop-blur-3xl"
        aria-label="Customer Navigation"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange(tab.id)}
              className={`relative py-3.5 px-4 rounded-[1.4rem] text-left transition-colors duration-200 focus:outline-none select-none group flex items-center justify-between ${
                isActive ? "text-indigo-950 font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {/* Apple Laminar Sliding Spring Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabLaminarPill"
                  className="absolute inset-0 bg-white rounded-[1.4rem] shadow-lg shadow-indigo-500/10 border border-white"
                  transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3 w-full">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/50"
                      : "bg-slate-100/90 text-slate-500 group-hover:bg-slate-200/70"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-extrabold tracking-tight flex items-center justify-between gap-1.5">
                    <span className="truncate">{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 flex items-center gap-1 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold truncate hidden sm:block">
                    {tab.description}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
};
