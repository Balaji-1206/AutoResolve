"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Truck,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { ActiveTab } from "@/lib/types";
import { fetchLiveOrders, LiveOrder } from "@/lib/api";
import { CarrierTrackingStepper } from "../CarrierTrackingStepper";
import { useToast } from "../Toast";

interface CustomerOrdersTabProps {
  onSelectOrderForResolution: (orderId: string, inquiryText: string) => void;
}

export const CustomerOrdersTab: React.FC<CustomerOrdersTabProps> = ({
  onSelectOrderForResolution,
}) => {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const toast = useToast();

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const liveOrders = await fetchLiveOrders();
      setOrders(liveOrders);
    } catch (err: any) {
      console.error("Failed to fetch live orders:", err);
      toast.error("Orders Load Failed", "Unable to load live orders from records service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      (o.product_category || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.shipping_status || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 🌟 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Orders & Carrier Tracking
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Ledger Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Real-time delivery timestamps, live carrier status, and standard 30-day return eligibility.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium shadow-sm"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={loadOrders}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 shadow-sm transition-all"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* 🌟 2. Orders Grid */}
      {isLoading ? (
        <div className="glass-panel-elevated p-12 rounded-3xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading verified order records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel-elevated p-12 rounded-3xl text-center space-y-3 border border-white">
          <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No verified purchases matched "{search}". Check your order number or clear the search filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {filtered.map((order) => {
            const isRefundable = order.refundable ?? true;
            return (
              <motion.div
                key={order.order_id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25 }}
                className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-5 relative overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                        {order.order_id}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Account: {order.customer_id}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 mt-2 leading-snug">
                      {order.product_category || "AcmeCommerce Catalog Item"}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Transaction #{order.payment_id || "PAY-VERIFIED"}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xl sm:text-2xl font-black text-slate-900">
                      ${order.total_amount.toFixed(2)}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {order.order_date.split("T")[0]}
                    </span>
                  </div>
                </div>

                {/* 🚚 Step-by-Step Carrier Tracking Stepper */}
                <CarrierTrackingStepper
                  orderDate={order.order_date}
                  deliveryDate={order.delivery_date}
                  shippingStatus={order.shipping_status || order.status}
                  refundable={isRefundable}
                />

                {/* Order Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    {isRefundable ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Eligible for Return
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        Final Sale • Non-Refundable
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const sampleMsg = `Hi, I need assistance with my order ${order.order_id}. I received it on ${order.delivery_date || "recently"} and would like to request a return.`;
                      onSelectOrderForResolution(order.order_id, sampleMsg);
                      toast.info("Order Selected", `Loaded ${order.order_id} into resolution assistant.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <span>Request Return / Help</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
