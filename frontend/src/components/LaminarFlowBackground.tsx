"use client";

import React from "react";
import { motion } from "framer-motion";

interface LaminarFlowBackgroundProps {
  variant?: "gateway" | "customer" | "admin";
  className?: string;
}

export const LaminarFlowBackground: React.FC<LaminarFlowBackgroundProps> = ({
  variant = "gateway",
  className = "",
}) => {
  const isGateway = variant === "gateway";
  const isCustomer = variant === "customer";
  const isAdmin = variant === "admin";

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* 🌊 Layer 1: Ambient Laminar Gradient Glows (Non-turbulent, slow undulating fluid volumes) */}
      <motion.div
        animate={{
          x: [0, 30, -25, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.08, 0.96, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -top-32 -left-32 w-[44rem] h-[44rem] rounded-full blur-[100px] opacity-70 ${
          isAdmin
            ? "bg-gradient-to-tr from-amber-400/25 via-orange-300/18 to-rose-400/15"
            : "bg-gradient-to-tr from-indigo-500/20 via-violet-400/18 to-sky-300/12"
        }`}
      />

      <motion.div
        animate={{
          x: [0, -35, 30, 0],
          y: [0, 45, -20, 0],
          scale: [1, 1.1, 0.94, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/3 -right-36 w-[42rem] h-[42rem] rounded-full blur-[110px] opacity-65 ${
          isAdmin
            ? "bg-gradient-to-bl from-rose-400/20 via-amber-300/15 to-orange-400/10"
            : "bg-gradient-to-bl from-sky-400/20 via-teal-300/15 to-indigo-300/12"
        }`}
      />

      <motion.div
        animate={{
          x: [0, 25, -30, 0],
          y: [0, -30, 35, 0],
          scale: [1, 1.06, 0.97, 1],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -bottom-36 left-1/4 w-[40rem] h-[40rem] rounded-full blur-[100px] opacity-60 ${
          isAdmin
            ? "bg-gradient-to-tr from-amber-300/20 via-yellow-200/15 to-transparent"
            : "bg-gradient-to-tr from-violet-400/18 via-emerald-300/12 to-transparent"
        }`}
      />

      {/* 🌊 Layer 2: Laminar Streamline Vectors (Parallel Streamlines with Zero Turbulence) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.35] mix-blend-multiply"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
      >
        <defs>
          {/* Streamline Gradients */}
          <linearGradient id="laminar-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isAdmin ? "#f59e0b" : "#6366f1"} stopOpacity="0.05" />
            <stop offset="50%" stopColor={isAdmin ? "#f43f5e" : "#8b5cf6"} stopOpacity="0.35" />
            <stop offset="100%" stopColor={isAdmin ? "#fbbf24" : "#06b6d4"} stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="laminar-secondary-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isAdmin ? "#fb923c" : "#3b82f6"} stopOpacity="0.05" />
            <stop offset="50%" stopColor={isAdmin ? "#ea580c" : "#10b981"} stopOpacity="0.28" />
            <stop offset="100%" stopColor={isAdmin ? "#e11d48" : "#8b5cf6"} stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="laminar-ribbon-fill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isAdmin ? "#f59e0b" : "#6366f1"} stopOpacity="0.01" />
            <stop offset="30%" stopColor={isAdmin ? "#fb923c" : "#818cf8"} stopOpacity="0.06" />
            <stop offset="70%" stopColor={isAdmin ? "#f43f5e" : "#06b6d4"} stopOpacity="0.06" />
            <stop offset="100%" stopColor={isAdmin ? "#fbbf24" : "#a855f7"} stopOpacity="0.01" />
          </linearGradient>

          {/* Smooth Filter for Sub-surface Scattering */}
          <filter id="laminar-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Laminar Streamline 1 (Top Wave Stream) */}
        <motion.path
          d="M-100,120 C300,180 600,60 900,140 C1200,220 1500,80 1600,110"
          fill="none"
          stroke="url(#laminar-primary-grad)"
          strokeWidth="2.5"
          filter="url(#laminar-blur)"
          animate={{
            d: [
              "M-100,120 C300,180 600,60 900,140 C1200,220 1500,80 1600,110",
              "M-100,140 C300,90 600,170 900,80 C1200,160 1500,120 1600,130",
              "M-100,120 C300,180 600,60 900,140 C1200,220 1500,80 1600,110",
            ],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Laminar Streamline 2 (Parallel Glide Layer) */}
        <motion.path
          d="M-100,200 C300,260 600,140 900,220 C1200,300 1500,160 1600,190"
          fill="none"
          stroke="url(#laminar-primary-grad)"
          strokeWidth="1.8"
          strokeDasharray="8 12"
          animate={{
            d: [
              "M-100,200 C300,260 600,140 900,220 C1200,300 1500,160 1600,190",
              "M-100,220 C300,170 600,250 900,160 C1200,240 1500,200 1600,210",
              "M-100,200 C300,260 600,140 900,220 C1200,300 1500,160 1600,190",
            ],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Laminar Ribbon Envelope (Smooth fluid layer boundary) */}
        <motion.path
          d="M-100,320 C350,420 650,220 1000,360 C1300,460 1500,310 1600,340 L1600,480 C1400,420 1150,560 850,440 C550,340 250,520 -100,440 Z"
          fill="url(#laminar-ribbon-fill)"
          animate={{
            d: [
              "M-100,320 C350,420 650,220 1000,360 C1300,460 1500,310 1600,340 L1600,480 C1400,420 1150,560 850,440 C550,340 250,520 -100,440 Z",
              "M-100,360 C350,260 650,380 1000,280 C1300,390 1500,370 1600,380 L1600,520 C1400,460 1150,490 850,490 C550,410 250,460 -100,480 Z",
              "M-100,320 C350,420 650,220 1000,360 C1300,460 1500,310 1600,340 L1600,480 C1400,420 1150,560 850,440 C550,340 250,520 -100,440 Z",
            ],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Laminar Streamline 3 (Lower Harmonic Vector) */}
        <motion.path
          d="M-100,580 C320,680 700,500 1050,620 C1350,710 1500,600 1600,630"
          fill="none"
          stroke="url(#laminar-secondary-grad)"
          strokeWidth="2.2"
          filter="url(#laminar-blur)"
          animate={{
            d: [
              "M-100,580 C320,680 700,500 1050,620 C1350,710 1500,600 1600,630",
              "M-100,610 C320,530 700,640 1050,540 C1350,650 1500,660 1600,650",
              "M-100,580 C320,680 700,500 1050,620 C1350,710 1500,600 1600,630",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Laminar Streamline 4 (Bottom Steady Current) */}
        <motion.path
          d="M-100,720 C400,790 750,670 1100,760 C1380,820 1520,740 1600,760"
          fill="none"
          stroke="url(#laminar-secondary-grad)"
          strokeWidth="1.5"
          strokeDasharray="6 14"
          animate={{
            d: [
              "M-100,720 C400,790 750,670 1100,760 C1380,820 1520,740 1600,760",
              "M-100,740 C400,690 750,770 1100,700 C1380,780 1520,780 1600,780",
              "M-100,720 C400,790 750,670 1100,760 C1380,820 1520,740 1600,760",
            ],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* 🌊 Layer 3: Laminar Flow Stream Pulses (Photons riding steadily along stream vectors) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Stream Photon 1 */}
        <motion.div
          animate={{
            x: ["-10vw", "110vw"],
            y: ["15vh", "22vh", "12vh", "18vh"],
            opacity: [0, 0.7, 0.7, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "linear",
            delay: 1,
          }}
          className={`absolute w-32 h-1 rounded-full blur-[2px] ${
            isAdmin
              ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              : "bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
          }`}
        />

        {/* Stream Photon 2 */}
        <motion.div
          animate={{
            x: ["-10vw", "110vw"],
            y: ["42vh", "35vh", "46vh", "38vh"],
            opacity: [0, 0.65, 0.65, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
            delay: 6,
          }}
          className={`absolute w-44 h-1.5 rounded-full blur-[2px] ${
            isAdmin
              ? "bg-gradient-to-r from-transparent via-rose-400 to-transparent"
              : "bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          }`}
        />

        {/* Stream Photon 3 */}
        <motion.div
          animate={{
            x: ["-10vw", "110vw"],
            y: ["75vh", "68vh", "78vh", "72vh"],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "linear",
            delay: 10,
          }}
          className={`absolute w-36 h-1 rounded-full blur-[2px] ${
            isAdmin
              ? "bg-gradient-to-r from-transparent via-amber-300 to-transparent"
              : "bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          }`}
        />
      </div>

      {/* 🌊 Layer 4: Micro-fine Prismatic Noise Texture (Prevents color banding on retina displays) */}
      <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.015]" />
    </div>
  );
};
