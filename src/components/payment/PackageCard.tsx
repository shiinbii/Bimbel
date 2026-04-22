"use client";

import { motion } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { PointPackage } from "@/lib/types";
import { formatIDR } from "@/lib/utils";

interface Props {
  pkg: PointPackage;
  onBuy: () => void;
  index?: number;
}

export default function PackageCard({ pkg, onBuy, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative card p-5 ${pkg.popular ? "border-indigo-500/40 glow-primary" : ""}`}
    >
      {pkg.popular && (
        <Badge tone="gold" className="absolute -top-3 left-4 gap-1">
          <Sparkles className="w-3 h-3" /> Populer
        </Badge>
      )}
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-soft)]">
        {pkg.name}
      </p>
      <p className="mt-2 font-serif text-3xl text-[var(--color-text)]">
        {formatIDR(pkg.price)}
      </p>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300">
        <Coins className="w-3.5 h-3.5" />
        <span className="text-sm font-semibold">{pkg.points} poin</span>
        {pkg.bonus && (
          <span className="text-[10px] uppercase tracking-wider text-amber-400/80">
            + bonus {pkg.bonus}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-[var(--color-text-soft)] min-h-[2.5rem]">
        {pkg.description}
      </p>
      <Button full className="mt-5" variant={pkg.popular ? "primary" : "outline"} onClick={onBuy}>
        Beli Paket
      </Button>
    </motion.div>
  );
}
