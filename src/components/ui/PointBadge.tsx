"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Props {
  points: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function PointBadge({ points, size = "md", label }: Props) {
  const sizeMap = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border border-amber-500/30 ${sizeMap[size]}`}
    >
      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.5)]">
        <Coins className="w-3 h-3 text-amber-900" />
      </span>
      <span className="font-semibold text-amber-200">
        {formatNumber(points)}
      </span>
      {label && (
        <span className="text-amber-300/70 font-normal">{label}</span>
      )}
    </motion.div>
  );
}
