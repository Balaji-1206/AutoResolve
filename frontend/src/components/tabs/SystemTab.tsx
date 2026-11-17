"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  RotateCcw,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Search,
  HelpCircle,
  Clock,
  PackageCheck,
} from "lucide-react";
import { fetchPolicies, PolicyDocument } from "@/lib/api";
import { useToast } from "../Toast";
import { CopyButton } from "../CopyButton";

export const SystemTab: React.FC = () => {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const toast = useToast();

  const loadPoliciesData = async () => {
    setIsLoadingDocs(true);
    setDocError(null);
    try {
      const docs = await fetchPolicies();
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDoc((prev) => (docs.some((d) => d.id === prev) ? prev : docs[0].id));
      }
    } catch (err: any) {
      console.error("Failed to load store policies:", err);
      setDocError(err.message || "Failed to load store policies.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadPoliciesData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPoliciesData();
      toast.success("Policies Refreshed", "Store policies and guidelines updated.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fullText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDoc = documents.find((d) => d.id === selectedDoc) || documents[0] || null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 🌟 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Help Center & Store Policies
            </h2>
            <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              AcmeCommerce Guarantee
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5">
            Transparent return policies, shipping coverage, and customer satisfaction standards.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-600 shadow-sm transition-all"
            title="Refresh policies"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh Policies</span>
          </motion.button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>24/7 Automated Care Online</span>
          </div>
        </div>
      </motion.div>

      {/* 🌟 2. Customer Trust Highlights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Card 1: 30-Day Return Guarantee */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.28 }}
          className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  30-Day Hassle-Free Returns
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  Satisfaction Guarantee
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Standard
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Return Window:</span>
              <span className="font-bold text-slate-900">30 Days from Delivery</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Condition:</span>
              <span className="font-bold text-slate-900">Unworn / Original Box</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Refund Method:</span>
              <span className="font-bold text-slate-900">100% Original Payment</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Approval Speed:</span>
              <span className="font-bold text-indigo-600">Instant Automated</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Free Prepaid Shipping */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.28 }}
          className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Prepaid Shipping Labels
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  Zero Return Postage Cost
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Free
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Shipping Carriers:</span>
              <span className="font-bold text-slate-900">UPS Ground & FedEx</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Label Delivery:</span>
              <span className="font-bold text-slate-900">Instant Digital Download</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Drop-off Points:</span>
              <span className="font-bold text-slate-900">10,000+ Retail Locations</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Package Tracking:</span>
              <span className="font-bold text-emerald-600">Full Real-Time Tracking</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Fair & Transparent Resolutions */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.28 }}
          className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-100 text-violet-600 shadow-sm">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Fair & Fast Resolutions
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  Automated Self-Service
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              24/7
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Resolution Time:</span>
              <span className="font-bold text-slate-900">Instant (Under 1 Second)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Manager Review:</span>
              <span className="font-bold text-slate-900">Available for High-Value</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Customer Notifications:</span>
              <span className="font-bold text-emerald-600">Instant Email Delivery</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Hold Time:</span>
              <span className="font-bold text-indigo-600">Zero Wait Time</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 🌟 3. Authoritative Policy Explorer */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl border border-white shadow-xl space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b pb-3.5 border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
              Official Store Guidelines & Purchase Policies
            </h3>
          </div>

          {/* Search Policy Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search store policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        {isLoadingDocs ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm font-semibold">Loading official store policies...</p>
          </div>
        ) : docError && documents.length === 0 ? (
          <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-rose-800">
              Unable to load policies right now
            </p>
            <p className="text-xs text-rose-600 font-medium">{docError}</p>
            <button
              onClick={loadPoliciesData}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Policy Document List */}
            <div className="space-y-2.5">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDoc === doc.id;
                  return (
                    <motion.button
                      key={doc.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedDoc(doc.id);
                        toast.info("Viewing Policy", doc.title);
                      }}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl text-left transition-all border ${
                        isSelected
                          ? "glass-panel-elevated ring-2 ring-indigo-500 shadow-md shadow-indigo-500/15 border-indigo-200"
                          : "glass-card-interactive"
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-black text-slate-900">{doc.title}</div>
                      <div className="text-[11px] font-bold text-indigo-600 mt-0.5">
                        {doc.category}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {doc.summary}
                      </p>
                    </motion.button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-200">
                  No policy matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Document Content Viewer */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed max-h-[360px] overflow-y-auto shadow-sm space-y-3">
              {currentDoc ? (
                <>
                  <div className="border-b pb-2.5 border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Policy Document Preview
                    </span>
                    <CopyButton textToCopy={currentDoc.fullText} label="Copy Policy" />
                  </div>
                  <div className="whitespace-pre-wrap font-sans font-normal text-slate-700 leading-relaxed">
                    {currentDoc.fullText}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Select a policy from the list to view its guidelines.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
