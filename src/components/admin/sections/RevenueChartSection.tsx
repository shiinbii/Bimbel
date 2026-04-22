"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const revenue = [420, 520, 380, 610, 540, 720, 810, 690, 880, 930, 1040, 1250];
const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default function RevenueChartSection() {
  const maxRev = Math.max(...revenue);
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--color-text)]">Revenue 12 Bulan Terakhir</h2>
          <p className="text-sm text-[var(--color-text-soft)]">
            Total pendapatan platform dalam jutaan rupiah.
          </p>
        </div>
        <Badge tone="primary">+18% MoM</Badge>
      </div>
      <Card className="p-6">
        <div className="flex items-end gap-2 h-48">
          {revenue.map((v, i) => {
            const h = (v / maxRev) * 100;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="flex-1 rounded-t-lg relative group"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(99,102,241,0.9), rgba(99,102,241,0.3))",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px rgba(99,102,241,0.2)",
                }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition px-2 py-1 rounded-md bg-black/80 text-xs text-[var(--color-text)] whitespace-nowrap">
                  Rp {(v * 100_000) / 1000}K
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          {months.map((m) => (
            <span
              key={m}
              className="flex-1 text-[10px] text-center uppercase tracking-widest text-[var(--color-text-soft)]"
            >
              {m}
            </span>
          ))}
        </div>
      </Card>
    </section>
  );
}
