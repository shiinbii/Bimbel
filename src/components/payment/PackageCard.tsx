"use client";

import { motion } from "framer-motion";
import { CalendarClock, Check, Coins, Sparkles } from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { PackageCategory, PointPackage } from "@/lib/types";
import { formatIDR } from "@/lib/utils";

const CATEGORY_LABEL: Record<PackageCategory, string> = {
  TRY_OUT: "Try Out",
  CBT: "CBT",
  MATERI: "Materi",
  LIVE_CLASS: "Live Class",
  TOKEN: "Token",
};

interface Props {
  pkg: PointPackage;
  onBuy: () => void;
  index?: number;
}

export default function PackageCard({ pkg, onBuy, index = 0 }: Props) {
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPct = hasDiscount ? Math.round(((pkg.originalPrice! - pkg.price) / pkg.originalPrice!) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`card relative flex flex-col p-5 ${pkg.popular ? "glow-primary border-indigo-500/40" : ""}`}
    >
      {pkg.popular && (
        <Badge tone="gold" className="absolute -top-3 left-4 gap-1">
          <Sparkles className="h-3 w-3" /> Populer
        </Badge>
      )}
      {hasDiscount && (
        <Badge tone="danger" className="absolute -top-3 right-4">
          -{discountPct}%
        </Badge>
      )}

      <div className="flex items-center justify-between gap-2">
        {pkg.category && (
          <Badge tone="primary" className="text-[10px]">
            {CATEGORY_LABEL[pkg.category]}
          </Badge>
        )}
        <p className="truncate text-xs tracking-[0.25em] text-[var(--color-text-soft)] uppercase">{pkg.name}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <p className="font-serif text-3xl text-[var(--color-text)]">{formatIDR(pkg.price)}</p>
        {hasDiscount && (
          <p className="text-sm text-[var(--color-text-soft)] line-through">{formatIDR(pkg.originalPrice!)}</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300">
          <Coins className="h-3.5 w-3.5" />
          <span className="text-sm font-semibold">{pkg.points} poin</span>
          {pkg.bonus ? (
            <span className="text-[10px] tracking-wider text-amber-400/80 uppercase">+ bonus {pkg.bonus}</span>
          ) : null}
        </div>
        {pkg.durationDays ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300">
            <CalendarClock className="h-3 w-3" />
            {pkg.durationDays} hari
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-[var(--color-text-soft)]">{pkg.description}</p>

      {pkg.features && pkg.features.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-soft)]">
              <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      <Button full className="mt-5" variant={pkg.popular ? "primary" : "outline"} onClick={onBuy}>
        Beli Paket
      </Button>
    </motion.div>
  );
}
