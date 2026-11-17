"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Mail,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { CUSTOMER_PROFILES, CustomerProfile } from "@/lib/customerProfiles";
import { fetchLiveOrderById, LiveOrder } from "@/lib/api";
import { useToast } from "./Toast";

interface OrderLookupGatewayProps {
  selectedProfile: CustomerProfile;
  onSelectProfile: (profile: CustomerProfile) => void;
  onOrderFound: (order: LiveOrder) => void;
}

export const OrderLookupGateway: React.FC<OrderLookupGatewayProps> = ({
  selectedProfile,
  onSelectProfile,
  onOrderFound,
}) => {
  const [gatewayMode, setGatewayMode] = useState<"lookup" | "profiles">("profiles");
  const [orderQuery, setOrderQuery] = useState<string>("ORD-1001");
  const [postalOrEmail, setPostalOrEmail] = useState<string>("aarav.kumar@example.com");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const toast = useToast();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim() || isSearching) return;
    setIsSearching(true);

    try {
      const order = await fetchLiveOrderById(orderQuery);
      onOrderFound(order);
      toast.success("Order Verified", `Loaded ${order.order_id} ($${order.total_amount.toFixed(2)}) from live records.`);
    } catch (err: any) {
      toast.error("Lookup Unsuccessful", err.message || `Order ${orderQuery} could not be verified.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-5 sm:p-6 rounded-3xl border border-white shadow-xl space-y-4"
    >
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between border-b pb-3 border-slate-100 gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs font-bold">
          <button
            onClick={() => setGatewayMode("profiles")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              gatewayMode === "profiles"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer Profiles</span>
          </button>

          <button
            onClick={() => setGatewayMode("lookup")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              gatewayMode === "lookup"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Look Up by Order #</span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-400 hidden sm:flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Order Gateway</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {gatewayMode === "profiles" ? (
          <motion.div
            key="profiles"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap items-center justify-between gap-4"
          >
            {/* Active Profile Info */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white font-black text-base flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white">
                {selectedProfile.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base">
                    {selectedProfile.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedProfile.customerId}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                  {selectedProfile.email} • Active Order:{" "}
                  <strong className="text-slate-800">{selectedProfile.recentOrderId}</strong> ($
                  {selectedProfile.orderAmount.toFixed(2)})
                </div>
              </div>
            </div>

            {/* Quick Profile Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Switch:
              </span>
              {CUSTOMER_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProfile(p)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    selectedProfile.id === p.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{p.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="lookup"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onSubmit={handleLookup}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
          >
            <div className="sm:col-span-5 relative">
              <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Order Number (e.g. ORD-1001)"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-900 shadow-sm"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Billing Email or Postal Code"
                value={postalOrEmail}
                onChange={(e) => setPostalOrEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-medium text-slate-900 shadow-sm"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={isSearching || !orderQuery.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
