"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useToast } from "./Toast";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  toastTitle?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label,
  toastTitle = "Copied to clipboard",
  className = "",
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const toast = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(toastTitle, textToCopy.length > 60 ? `${textToCopy.substring(0, 60)}...` : textToCopy);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed", "Could not write to clipboard.");
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={handleCopy}
      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all select-none border shadow-sm ${
        copied
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200"
      } ${className}`}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
          <span>{label || "Copied!"}</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </motion.button>
  );
};

