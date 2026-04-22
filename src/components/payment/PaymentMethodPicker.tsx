"use client";

import { motion } from "framer-motion";
import { Check, CreditCard, QrCode, Smartphone, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Method {
  key: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
}

const methods: Method[] = [
  { key: "VA", label: "Virtual Account", sub: "BCA / Mandiri / BNI / BRI", icon: <Wallet className="w-4 h-4" /> },
  { key: "GOPAY", label: "GoPay", sub: "E-wallet · scan & bayar", icon: <Smartphone className="w-4 h-4" /> },
  { key: "QRIS", label: "QRIS", sub: "Semua e-wallet & mobile banking", icon: <QrCode className="w-4 h-4" /> },
  { key: "CC", label: "Kartu Kredit", sub: "Visa / Mastercard / JCB", icon: <CreditCard className="w-4 h-4" /> },
];

export default function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {methods.map((m) => {
        const active = value === m.key;
        return (
          <motion.button
            key={m.key}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onChange(m.key)}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl border text-left transition",
              active
                ? "border-indigo-500/60 bg-indigo-500/10"
                : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/30"
            )}
          >
            <span
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                active ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)]" : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)]"
              )}
            >
              {m.icon}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-text)]">{m.label}</p>
              <p className="text-xs text-[var(--color-text-soft)]">{m.sub}</p>
            </div>
            {active && (
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-[var(--color-text)]" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
