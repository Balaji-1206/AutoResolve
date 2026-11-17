"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { ActiveTab } from "@/lib/types";
import { useToast } from "../Toast";

interface CustomerOrdersTabProps {
  onSelectOrderForResolution: (orderId: string, inquiryText: string) => void;
}

export const CustomerOrdersTab: React.FC<CustomerOrdersTabProps> = ({
  onSelectOrderForResolution,
}) => {
  const [search, setSearch] = useState<string>("");
  const toast = useToast();

  const customerOrders = [
    {
      orderId: "ORD-1001",
      customerName: "Aarav Kumar",
      itemTitle: "AcmeCommerce Velocity Pro Running Shoes (Size 10.5)",
      category: "Footwear / Apparel",
      amount: 120.0,
      orderDate: "Sep 12, 2026",
      deliveredDate: "Delivered Sep 16, 2026 (14 days ago)",
      status: "DELIVERED",
      refundable: true,
      returnWindowDaysLeft: 16,
      presetText: "Hi, I received my running shoes from order ORD-1001 14 days ago. They don't fit well. Can I exchange or return them?",
    },
    {
      orderId: "ORD-1002",
      customerName: "Robert Chen",
      itemTitle: "AcmeVision 55\" 4K Ultra HD Cinema Smart TV",
      category: "Consumer Electronics",
      amount: 750.0,
      orderDate: "Sep 15, 2026",
      deliveredDate: "Delivered Sep 20, 2026 (10 days ago)",
      status: "DELIVERED",
      refundable: true,
      returnWindowDaysLeft: 20,
      presetText: "I want to return the 4K Ultra HD TV in order ORD-1002. The screen size does not fit my living room stand.",
    },
    {
      orderId: "ORD-1005",
      customerName: "Devon Vance",
      itemTitle: "Artisan Custom Handcrafted Engraved Wooden Keepsake",
      category: "Custom Crafts",
      amount: 45.0,
      orderDate: "Sep 16, 2026",
      deliveredDate: "Delivered Sep 22, 2026 (8 days ago)",
      status: "DELIVERED",
      refundable: false,
      returnWindowDaysLeft: 0,
      presetText: "I bought a custom engraved wood craft set in order ORD-1005 and I changed my mind. Please refund it.",
    },
    {
      orderId: "ORD-1006",
      customerName: "Elena Rostova",
      itemTitle: "SurroundSound 5.1 Theater Speaker System",
      category: "Home Audio",
      amount: 210.0,
      orderDate: "Sep 25, 2026",
      deliveredDate: "Warehouse Status: Processing",
      status: "PROCESSING",
      refundable: true,
      returnWindowDaysLeft: 30,
      presetText: "My order ORD-1006 arrived damaged yesterday and parts are missing. I want a refund right away.",
    },
  ];

  const filtered = customerOrders.filter(
    (o) =>
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.itemTitle.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Orders & Return Eligibility
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            View your verified purchase history, carrier delivery timestamps, and 30-day return windows.
          </p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium shadow-sm"
          />
        </div>
      </motion.div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {filtered.map((order) => (
          <motion.div
            key={order.orderId}
            whileHover={{ y: -3 }}
            className="glass-panel-elevated p-6 rounded-3xl border border-white shadow-xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                    {order.orderId}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Customer: {order.customerName}
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900 mt-2 leading-snug">
                  {order.itemTitle}
                </h3>
                <span className="text-xs text-slate-400 font-medium">{order.category}</span>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-xl font-black text-slate-900">
                  ${order.amount.toFixed(2)}
                </div>
                <span className="text-[11px] font-bold text-slate-500 block">
                  Ordered {order.orderDate}
                </span>
              </div>
            </div>

            {/* Carrier Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  Carrier Tracking Status
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    order.status === "DELIVERED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="text-slate-900 font-semibold">{order.deliveredDate}</div>
            </div>

            {/* Return Policy Window Pill */}
            <div className="flex items-center justify-between text-xs pt-1">
              {order.refundable ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Eligible for Return ({order.returnWindowDaysLeft} days left)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Custom Item • Non-Refundable Policy</span>
                </div>
              )}

              <button
                onClick={() => {
                  onSelectOrderForResolution(order.orderId, order.presetText);
                  toast.info("Order Selected", `Loaded ${order.orderId} into Resolution Assistant.`);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
              >
                <span>Request Return / Help</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
