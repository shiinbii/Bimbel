"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Lock, Sparkles, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { TierConfig } from "@/lib/tier-config-store";

interface Props {
  required: TierConfig;
  current: TierConfig;
  feature: string;
  description?: string;
  upgradeHref?: string;
  onClose?: () => void;
}

export default function TierGate({
  required,
  current,
  feature,
  description,
  upgradeHref = "/student/dashboard#packages",
  onClose,
}: Props) {
  const router = useRouter();
  const pointsNeeded = Math.max(0, required.minPoints - current.minPoints);

  const handleClose = () => {
    if (onClose) onClose();
    else router.push("/student/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-amber-500/25 p-8 md:p-10 text-center"
      style={{
        background:
          "radial-gradient(600px 280px at 50% 0%, rgba(245,158,11,0.18), transparent 60%), linear-gradient(160deg, rgba(245,158,11,0.08), rgba(99,102,241,0.05)), var(--color-bg)",
      }}
    >
      {/* Close button (top right) */}
      <button
        type="button"
        onClick={handleClose}
        title="Tutup"
        className="absolute top-3 right-3 z-10 w-10 h-10 rounded-xl border border-[var(--color-border)] bg-black/20 hover:bg-red-500/20 hover:border-red-500/40 text-[var(--color-text)] flex items-center justify-center transition"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 items-center justify-center shadow-[0_10px_30px_-10px_rgba(245,158,11,0.7)] mb-4">
        <Lock className="w-7 h-7 text-[var(--color-text)]" />
      </div>
      <Badge tone="gold" className="mb-3 gap-1">
        <Crown className="w-3 h-3" />
        Tier {required.name}+
      </Badge>
      <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-text)]">
        {feature} butuh tier{" "}
        <span className="italic text-gradient-gold">{required.name}</span>
      </h2>
      <p className="mt-3 text-sm text-[var(--color-text-soft)] max-w-md mx-auto">
        {description ??
          `Tier kamu saat ini (${current.name}) belum mencakup fitur ini. Top up poin untuk naik tier otomatis.`}
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-3">
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-soft)]">
            Tier kamu
          </p>
          <p className="mt-1 font-serif text-lg text-[var(--color-text)]">{current.name}</p>
          <p className="text-xs text-[var(--color-text-soft)] mt-0.5">
            Min. {current.minPoints} poin · {current.description}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-[10px] uppercase tracking-widest text-amber-300">
            Tier yang dibutuhkan
          </p>
          <p className="mt-1 font-serif text-lg text-gradient-gold">
            {required.name}
          </p>
          <p className="text-xs text-[var(--color-text-soft)] mt-0.5">
            Min. {required.minPoints} poin · {required.description}
          </p>
        </div>
      </div>

      {pointsNeeded > 0 && (
        <p className="mt-4 text-xs text-amber-200">
          Butuh <strong className="text-[var(--color-text)]">+{pointsNeeded} poin</strong>{" "}
          lagi untuk naik tier otomatis.
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="outline"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={handleClose}
        >
          Kembali
        </Button>
        <Link href={upgradeHref}>
          <Button
            variant="gold"
            size="lg"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Top Up ke {required.name}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
