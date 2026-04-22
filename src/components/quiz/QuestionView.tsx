"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  question: Question;
  selected?: "A" | "B" | "C" | "D";
  onSelect: (k: "A" | "B" | "C" | "D") => void;
  number: number;
}

export default function QuestionView({ question, selected, onSelect, number }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      key={question.id}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm font-semibold items-center justify-center">
          {number}
        </span>
        <span className="text-xs uppercase tracking-widest text-[var(--color-text-soft)]">
          Soal #{number}
        </span>
      </div>

      <p className="text-lg md:text-xl text-[var(--color-text)] leading-relaxed font-serif">
        {question.text}
      </p>

      <div className="mt-6 space-y-2.5">
        {question.options.map((o, i) => {
          const isSelected = selected === o.key;
          return (
            <motion.button
              key={o.key}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(o.key)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition text-left",
                isSelected
                  ? "border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-soft)] hover:border-indigo-500/40 hover:bg-[var(--color-bg-soft)]"
              )}
            >
              <span
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center font-serif text-lg shrink-0",
                  isSelected
                    ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)]"
                    : "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)]"
                )}
              >
                {o.key}
              </span>
              <span className="text-sm md:text-[15px] text-[var(--color-text)] flex-1">{o.text}</span>
              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-indigo-300 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--color-text-mute)] shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
