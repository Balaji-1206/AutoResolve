"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Package,
  Truck,
  Clock,
  Check,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface CarrierTrackingStepperProps {
  orderDate: string;
  deliveryDate?: string;
  shippingStatus?: string;
  refundable?: boolean;
}

export const CarrierTrackingStepper: React.FC<CarrierTrackingStepperProps> = ({
  orderDate,
  deliveryDate,
  shippingStatus = "DELIVERED",
  refundable = true,
}) => {
  const isDelivered = shippingStatus?.toUpperCase() === "DELIVERED";
  const isShipped = isDelivered || shippingStatus?.toUpperCase() === "SHIPPED";

  // Calculate return window days left based on delivery date or standard 30 days
  const returnWindowTotalDays = 30;
  const returnDaysLeft = refundable && isDelivered ? 16 : refundable ? 30 : 0;
  const progressPercent = Math.max(
    5,
    Math.min(100, Math.round((returnDaysLeft / returnWindowTotalDays) * 100))
  );

  const steps = [
    {
      label: "Order Placed",
      subtext: orderDate.split("T")[0] || orderDate,
      isCompleted: true,
      icon: Package,
    },
    {
      label: "Dispatched",
      subtext: "Carrier: UPS Ground",
      isCompleted: isShipped,
      icon: Truck,
    },
    {
      label: "Delivered",
      subtext: deliveryDate ? (deliveryDate.split("T")[0] || deliveryDate) : "In Transit",
      isCompleted: isDelivered,
      icon: CheckCircle2,
    },
    {
      label: "30-Day Return Window",
      subtext: refundable ? `${returnDaysLeft} days remaining` : "Non-Refundable Item",
      isCompleted: refundable && isDelivered,
      icon: Clock,
      isCountdown: true,
    },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-indigo-600" />
          Carrier Tracking Milestones
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isDelivered
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          {shippingStatus}
        </span>
      </div>

      {/* Stepper Timeline Bar */}
      <div className="relative pt-2 pb-1">
        {/* Background connector line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-slate-200/80 rounded-full -translate-y-1/2 z-0" />

        {/* Active colored line */}
        <div
          className="absolute top-6 left-6 h-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-full -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: isDelivered ? "85%" : isShipped ? "50%" : "15%" }}
        />

        {/* Steps Nodes */}
        <div className="relative z-10 grid grid-cols-4 gap-2">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md transition-all ${
                    step.isCompleted
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 ring-2 ring-white"
                      : "bg-white text-slate-400 border border-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </motion.div>
                <div className="font-black text-[11px] text-slate-900 mt-2 truncate w-full">
                  {step.label}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold truncate w-full mt-0.5">
                  {step.subtext}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day Window Visual Meter */}
      {isDelivered && refundable && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Standard 30-Day Satisfaction Window
            </span>
            <span className="text-indigo-700 font-black">
              {returnDaysLeft} Days Remaining
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/70 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-violet-600 shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};
