"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Mail,
  ArrowRight,
  Sparkles,
  DollarSign,
  Calendar,
} from "lucide-react";
import { fetchLiveOrderById, LiveOrder } from "@/lib/api";
import { useToast } from "./Toast";

interface OrderLookupGatewayProps {
  onOrderFound: (order: LiveOrder, email: string) => void;
  activeOrder?: LiveOrder | null;
}

const SAMPLE_ORDERS = [
  {
    orderId: "ORD-1001",
    email: "aarav.kumar@example.com",
    title: "Running Shoes ($120.00)",
  },
  {
    orderId: "ORD-1002",
    email: "priya.sharma@example.com",
    title: "4K Ultra HD TV ($1,299.99 - High Value)",
  },
  {
    orderId: "ORD-1003",
    email: "rohan.gupta@example.com",
    title: "Wireless Headphones ($85.00)",
  },
];

export const OrderLookupGateway: React.FC<OrderLookupGatewayProps> = ({
  onOrderFound,
  activeOrder,
}) => {
  const [orderId, setOrderId] = useState<string>("ORD-1001");
  const [customerEmail, setCustomerEmail] = useState<string>("aarav.kumar@example.com");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [verifiedOrder, setVerifiedOrder] = useState<LiveOrder | null>(activeOrder || null);
  const toast = useToast();

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderId.trim() || isSearching) return;
    setIsSearching(true);

    try {
      const order = await fetchLiveOrderById(orderId.trim());
      setVerifiedOrder(order);
      onOrderFound(order, customerEmail.trim());
      toast.success(
        "Order Verified & Loaded",
        `Order ${order.order_id} ($${order.total_amount.toFixed(2)}) verified from store database.`
      );
    } catch (err: any) {
      toast.error(
        "Order Lookup Failed",
        err.message || `Order ${orderId} was not found in active records.`
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_ORDERS[0]) => {
    setOrderId(sample.orderId);
    setCustomerEmail(sample.email);
    // Auto trigger lookup
    fetchLiveOrderById(sample.orderId)
      .then((order) => {
        setVerifiedOrder(order);
        onOrderFound(order, sample.email);
        toast.info("Sample Order Loaded", `${sample.orderId} ready for resolution.`);
      })
      .catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-5 bg-white/80 backdrop-blur-2xl"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Order Lookup Gateway
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Verify your purchase to request return, replacement, or refund
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Merchant Database</span>
        </div>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleLookup} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Order ID Input */}
          <div className="sm:col-span-5 relative">
            <Package className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Order Number (e.g. ORD-1001)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-900 shadow-sm"
              required
            />
          </div>

          {/* Email Input */}
          <div className="sm:col-span-4 relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="Billing Email (e.g. you@example.com)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none font-medium text-slate-900 shadow-sm"
              required
            />
          </div>

          {/* Search Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isSearching || !orderId.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Look Up Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Demo Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Demo Presets:
          </span>
          {SAMPLE_ORDERS.map((sample) => (
            <button
              key={sample.orderId}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all border ${
                orderId === sample.orderId
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <span>{sample.orderId}</span>
              <span className="text-slate-400 font-medium"> • {sample.title.split(" (")[0]}</span>
            </button>
          ))}
        </div>
      </form>

      {/* Verified Order Banner if found */}
      {verifiedOrder && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-slate-900">
                  {verifiedOrder.order_id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {verifiedOrder.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Category: <strong className="text-slate-700">{verifiedOrder.product_category || "General"}</strong> • Ordered on {verifiedOrder.order_date}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-black text-slate-900">
              ${verifiedOrder.total_amount.toFixed(2)} {verifiedOrder.currency || "USD"}
            </div>
            <div className="text-[10px] text-emerald-700 font-bold">
              {verifiedOrder.refundable !== false ? "Eligible for 30-Day Policy Review" : "Non-Refundable"}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
