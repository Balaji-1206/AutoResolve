"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquareText, GitBranch, UserCheck, Activity } from "lucide-react";
import { ActiveTab } from "@/lib/types";

interface TabsNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingReviewCount?: number;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingReviewCount = 1,
}) => {
  const tabs = [
    {
      id: "playground" as ActiveTab,
      label: "Resolution Desk",
      icon: MessageSquareText,
      description: "Live Customer Stream & AI Workspace",
    },
    {
      id: "supervisor" as ActiveTab,
      label: "Supervisor Queue",
      icon: UserCheck,
      description: "Human-in-the-Loop Sign-Off",
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    {
      id: "visualizer" as ActiveTab,
      label: "Decision Journey",
      icon: GitBranch,
      description: "Multi-Agent State Machine Audit",
    },
    {
      id: "system" as ActiveTab,
      label: "Knowledge & Policies",
      icon: Activity,
      description: "Authoritative Operating Guidelines",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="glass-panel p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2 shadow-sm border border-white/90"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange(tab.id)}
              className={`relative py-3 px-3.5 sm:py-3.5 sm:px-4 rounded-xl sm:rounded-2xl text-left transition-colors duration-200 focus:outline-none select-none group flex items-center justify-between ${
                isActive ? "text-indigo-950 font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {/* Active Tab Spring Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl sm:rounded-2xl shadow-md border border-white shadow-indigo-500/10"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3 w-full">
                <div
                  className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70"
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
                  <div className="text-[11px] text-slate-400 font-semibold hidden lg:block truncate mt-0.5">
                    {tab.description}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};
