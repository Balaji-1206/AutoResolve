"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpen,
  Database,
  Cpu,
  Sparkles,
  RefreshCw,
  Search,
} from "lucide-react";
import { fetchAllServiceHealth, fetchPolicies, PolicyDocument } from "@/lib/api";
import { ServiceHealth } from "@/lib/types";
import { useToast } from "../Toast";
import { CopyButton } from "../CopyButton";

export const SystemTab: React.FC = () => {
  const [healthList, setHealthList] = useState<ServiceHealth[]>([]);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const toast = useToast();

  const loadHealth = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAllServiceHealth();
      setHealthList(data);
    } finally {
      setIsRefreshing(false);
    }
  };

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
      console.error("Failed to load live policies:", err);
      setDocError(err.message || "Failed to fetch policies from RAG engine");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadHealth();
    loadPoliciesData();
  }, []);

  const handleManualRefresh = async () => {
    await Promise.all([loadHealth(), loadPoliciesData()]);
    toast.success("System Data Refreshed", "Live health and authoritative policies re-fetched.");
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
              System Architecture & Knowledge Repository
            </h2>
            <span className="px-3 py-1 text-xs font-black rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Decoupled Architecture
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1.5">
            Real-time status of policy knowledge engines, operational record stores, and autonomous decision coordinators.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-indigo-600 shadow-sm transition-all"
            title="Poll microservice health endpoints"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
            <span>Poll Health</span>
          </motion.button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>3 Distributed Services</span>
          </div>
        </div>
      </motion.div>

      {/* 🌟 2. Microservice Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {/* Service 1: Policy Knowledge Engine */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.28 }}
          className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Policy Knowledge Engine
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  Document Knowledge Service
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Port 8000
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Embedding Engine:</span>
              <span className="font-bold text-slate-900">all-MiniLM-L6-v2 (384-d)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Vector Store:</span>
              <span className="font-bold text-slate-900">FAISS (Cosine Index)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Policy Chunks:</span>
              <span className="font-bold text-slate-900">192 Indexed Sections</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Strict Quality Floor:</span>
              <span className="font-bold text-indigo-600">0.35 Score Minimum</span>
            </div>
          </div>
        </motion.div>

        {/* Service 2: Operational Data Service */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.28 }}
          className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
                <Database className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Operational Records
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  Order & Logistics Service
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Port 8001
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Recorded Orders:</span>
              <span className="font-bold text-slate-900">151 Purchases (ORD-XXXX)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Verified Customers:</span>
              <span className="font-bold text-slate-900">50 Accounts (CUS-XXXX)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Ledger Audit:</span>
              <span className="font-bold text-slate-900">200 Transactions</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Execution Safety:</span>
              <span className="font-bold text-emerald-600">Deterministic Read-Only</span>
            </div>
          </div>
        </motion.div>

        {/* Service 3: Intelligent Resolution Coordinator */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.28 }}
          className="glass-panel-elevated p-6 sm:p-7 rounded-3xl border border-white shadow-xl space-y-4 sm:space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-100 text-violet-600 shadow-sm">
                <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Resolution Coordinator
                </h3>
                <span className="text-[11px] text-slate-500 font-bold">
                  Decision Pipeline Engine
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Port 8002
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-slate-700 font-semibold">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Decision Pipeline:</span>
              <span className="font-bold text-slate-900">Multi-Node State Machine</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Local Reasoning:</span>
              <span className="font-bold text-slate-900">Qwen3 8B Neural Engine</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Security Shield:</span>
              <span className="font-bold text-emerald-600">Instant Pre-Check (&lt; 1 ms)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 font-medium">Human Oversight:</span>
              <span className="font-bold text-indigo-600">Checkpointed Resumption</span>
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
              Authoritative Company Guidelines & Policies
            </h3>
          </div>

          {/* Search Policy Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search policy rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-800 placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        {isLoadingDocs ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm font-semibold">Loading live policies from RAG knowledge engine...</p>
          </div>
        ) : docError && documents.length === 0 ? (
          <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-rose-800">
              Unable to load policies from RAG Knowledge Engine (Port 8000)
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
                      Authoritative Text Preview
                    </span>
                    <CopyButton textToCopy={currentDoc.fullText} label="Copy Policy" />
                  </div>
                  <div className="whitespace-pre-wrap font-sans font-normal text-slate-700 leading-relaxed">
                    {currentDoc.fullText}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                  Select a policy from the list to view its authoritative guidelines.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
