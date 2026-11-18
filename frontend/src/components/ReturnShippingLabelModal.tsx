"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  Download,
  Package,
  Truck,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./Toast";

interface ReturnShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerName: string;
  itemTitle?: string;
  refundAmount?: number;
  trackingNumber?: string;
  carrier?: string;
}

export const ReturnShippingLabelModal: React.FC<ReturnShippingLabelModalProps> = ({
  isOpen,
  onClose,
  orderId,
  customerName,
  itemTitle = "AcmeCommerce Order Item",
  refundAmount = 120.0,
  trackingNumber: trackingNumberProp,
  carrier = "UPS Ground",
}) => {
  const toast = useToast();
  if (!isOpen) return null;

  const rmaNumber = `RMA-${orderId.replace("ORD-", "")}-${Math.floor(100000 + Math.random() * 900000)}`;
  const trackingNumber =
    trackingNumberProp ||
    `1Z ${orderId.replace("ORD-", "99")}${Math.floor(100 + Math.random() * 899)} 02 ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success("Voucher Downloaded", "Digital shipping receipt saved to downloads.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="glass-panel-elevated bg-white/95 rounded-3xl border border-white shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-6 relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Prepaid Return Shipping Label
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Postage Paid
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Authorization #{rmaNumber} • Carrier: {carrier}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Box */}
        <div
          id="printable-return-label"
          className="p-6 rounded-2xl bg-white border-2 border-slate-900 text-slate-900 shadow-sm space-y-5 print:border-none print:shadow-none"
        >
          {/* Carrier Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight font-sans uppercase">
                {carrier}
              </div>
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                AcmeCommerce Authorized Return Service
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-black uppercase tracking-wider bg-slate-900 text-white px-3 py-1 rounded">
                NO POSTAGE NECESSARY
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-1">
                WT: 2.8 LBS • BILLED TO SENDER
              </div>
            </div>
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            {/* Sender */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                FROM (Customer):
              </span>
              <div className="font-bold text-slate-900">{customerName}</div>
              <div className="text-slate-600">Order Ref: {orderId}</div>
              <div className="text-slate-600">Verified Residential Address</div>
            </div>

            {/* Destination */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                SHIP TO (Returns Depot):
              </span>
              <div className="font-black text-slate-900">ACMECOMMERCE INTAKE #4</div>
              <div className="text-slate-700">4400 Logistics Blvd, Dock 18</div>
              <div className="text-slate-700 font-bold">Dallas, TX 75261-0012</div>
            </div>
          </div>

          {/* Synthetic Code-128 SVG Barcode */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
            <svg
              className="w-full max-w-md h-16"
              viewBox="0 0 320 60"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Distinct Barcode Pattern Generator */}
              {[
                4, 2, 6, 2, 2, 4, 8, 3, 2, 6, 4, 2, 8, 2, 4, 6, 2, 8, 4, 2, 2, 6,
                8, 3, 2, 4, 6, 2, 8, 4, 2, 6, 8, 2, 4, 3, 6, 8, 2, 4, 2, 6, 8, 3,
                2, 4, 6, 2, 8, 4, 2, 6, 8, 2, 4, 2, 6, 8, 4, 2,
              ].map((w, idx) => {
                const xOffset = idx * 5.2;
                return (
                  <rect
                    key={idx}
                    x={xOffset}
                    y="0"
                    width={Math.max(1.2, w * 0.4)}
                    height="50"
                    fill="#0f172a"
                  />
                );
              })}
            </svg>
            <div className="text-center font-mono font-bold text-xs tracking-widest text-slate-800">
              {trackingNumber}
            </div>
          </div>

          {/* RMA & Package Meta Footer */}
          <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600 gap-2">
            <div>
              <span className="font-bold text-slate-900">Return Authorization:</span> {rmaNumber}
            </div>
            <div>
              <span className="font-bold text-slate-900">Scheduled Refund:</span> ${refundAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-2">
          <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] block">
            How to Return Your Item:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-indigo-900 font-medium">
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <span>Pack the item securely with all accessories.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <span>Tape this prepaid label to the package exterior.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <span>Drop off at any UPS Store or Access Point.</span>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download Digital Voucher</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Return Label</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
