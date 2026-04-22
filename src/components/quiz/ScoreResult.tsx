"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Check, CheckCircle2, ChevronDown, HelpCircle, RotateCcw, Trophy, XCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import CountUp from "@/components/ui/CountUp";
import Badge from "@/components/ui/Badge";
import type { Question, Test } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  test: Test;
  answers: Record<string, "A" | "B" | "C" | "D" | undefined>;
  onRetry: () => void;
  onBack: () => void;
  /** When true, hide the per-question explanations (restricted tier). */
  hideExplanations?: boolean;
}

export default function ScoreResult({ test, answers, onRetry, onBack, hideExplanations }: Props) {
  const correctCount = test.questions.filter((q) => answers[q.id] === q.correct).length;
  const wrongCount = test.questions.filter((q) => answers[q.id] && answers[q.id] !== q.correct).length;
  const unanswered = test.questions.length - correctCount - wrongCount;
  const score = Math.round((correctCount / test.questions.length) * 100);
  const passed = score >= test.passingScore;

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpenIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-8 md:p-10 text-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: passed
              ? "radial-gradient(500px 200px at 50% 0%, rgba(16,185,129,0.25), transparent 70%)"
              : "radial-gradient(500px 200px at 50% 0%, rgba(239,68,68,0.2), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5"
            style={{
              background: passed
                ? "linear-gradient(160deg, #10b981, #047857)"
                : "linear-gradient(160deg, #ef4444, #991b1b)",
              boxShadow: passed
                ? "0 20px 60px -20px rgba(16,185,129,0.6)"
                : "0 20px 60px -20px rgba(239,68,68,0.5)",
            }}>
            <Trophy className="w-7 h-7 text-[var(--color-text)]" />
          </div>

          <Badge tone={passed ? "success" : "danger"} className="mb-3">
            {passed ? "LULUS" : "BELUM LULUS"}
          </Badge>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-soft)]">
            Skor akhir
          </p>
          <p className="font-serif text-7xl md:text-8xl text-gradient-gold mt-3">
            <CountUp to={score} />
          </p>
          <p className="text-[var(--color-text-soft)] mt-2">
            Batas lulus: {test.passingScore} · {test.title}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
            {[
              { label: "Benar", value: correctCount, color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30" },
              { label: "Salah", value: wrongCount, color: "text-red-300", bg: "bg-red-500/10 border-red-500/30" },
              { label: "Kosong", value: unanswered, color: "text-slate-300", bg: "bg-[var(--color-bg-soft)] border-[var(--color-border)]" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={cn("rounded-xl p-4 border", s.bg)}
              >
                <p className={cn("font-serif text-3xl", s.color)}>{s.value}</p>
                <p className="text-xs text-[var(--color-text-soft)]">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="outline" onClick={onBack}>Kembali ke Daftar</Button>
            <Button onClick={onRetry} leftIcon={<RotateCcw className="w-4 h-4" />}>
              Ulangi Quiz
            </Button>
          </div>
        </div>
      </motion.div>

      {/* REVIEW */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-serif text-2xl text-[var(--color-text)]">Review Jawaban</h3>
            <p className="text-sm text-[var(--color-text-soft)]">
              {hideExplanations
                ? "Pembahasan belum tersedia untuk tier kamu — upgrade untuk akses penuh."
                : "Pembahasan muncul otomatis untuk soal yang salah."}
            </p>
          </div>
        </div>

        {hideExplanations && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Pembahasan Soal Terkunci
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-soft)]">
                  Tier gratis hanya dapat melihat jawaban benar/salah. Naik tier
                  untuk membuka pembahasan lengkap + alasan per opsi.
                </p>
              </div>
              <a
                href="/student/dashboard#packages"
                className="text-xs text-amber-200 underline whitespace-nowrap"
              >
                Top Up Poin →
              </a>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {test.questions.map((q, i) => (
            <ReviewItem
              key={q.id}
              q={q}
              index={i}
              userAnswer={answers[q.id]}
              open={openIds.has(q.id)}
              onToggle={() => toggle(q.id)}
              hideExplanation={hideExplanations}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewItem({
  q, index, userAnswer, open, onToggle, hideExplanation,
}: {
  q: Question;
  index: number;
  userAnswer?: "A" | "B" | "C" | "D";
  open: boolean;
  onToggle: () => void;
  hideExplanation?: boolean;
}) {
  const isCorrect = userAnswer === q.correct;
  const isUnanswered = !userAnswer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isUnanswered
          ? "border-[var(--color-border)] bg-[var(--color-bg-soft)]"
          : "border-red-500/30 bg-red-500/5"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
            isCorrect
              ? "bg-emerald-500/20 text-emerald-300"
              : isUnanswered
              ? "bg-[var(--color-bg-soft)] text-[var(--color-text-soft)]"
              : "bg-red-500/20 text-red-300"
          )}
        >
          {isCorrect ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : isUnanswered ? (
            <HelpCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-soft)]">
              Soal #{index + 1}
            </span>
            <span className="text-xs text-[var(--color-text-soft)]">
              {isCorrect ? "Jawaban benar" : isUnanswered ? "Tidak dijawab" : "Jawaban salah"}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text)] truncate mt-0.5">{q.text}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {userAnswer && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-1 rounded-md",
                isCorrect
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              )}
            >
              Kamu: {userAnswer}
            </span>
          )}
          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Benar: {q.correct}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[var(--color-text-soft)] transition",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 space-y-3 border-t border-[var(--color-border)]">
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((o) => {
                  const isUser = userAnswer === o.key;
                  const isRight = q.correct === o.key;
                  return (
                    <div
                      key={o.key}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg text-sm border",
                        isRight
                          ? "border-emerald-500/40 bg-emerald-500/10 text-[var(--color-text)]"
                          : isUser
                          ? "border-red-500/40 bg-red-500/10 text-[var(--color-text)]"
                          : "border-[var(--color-border)] bg-[var(--color-bg-soft)] text-[var(--color-text-soft)]"
                      )}
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-md font-serif text-sm flex items-center justify-center",
                          isRight
                            ? "bg-emerald-500/30 text-emerald-200"
                            : isUser
                            ? "bg-red-500/30 text-red-200"
                            : "bg-[var(--color-bg-soft)]"
                        )}
                      >
                        {o.key}
                      </span>
                      <span className="flex-1">{o.text}</span>
                      {isRight && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                    </div>
                  );
                })}
              </div>
              {hideExplanation ? (
                <div className="rounded-xl p-4 border border-amber-500/25 bg-amber-500/5 text-center">
                  <p className="text-xs uppercase tracking-widest text-amber-300">
                    Pembahasan terkunci
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">
                    Upgrade tier untuk melihat pembahasan lengkap soal ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* Why user's wrong answer is wrong */}
                  {userAnswer &&
                    !isCorrect &&
                    q.optionExplanations?.[userAnswer] && (
                      <div className="rounded-xl p-4 bg-red-500/5 border border-red-500/25">
                        <p className="text-xs uppercase tracking-widest text-red-300 mb-2">
                          Kenapa {userAnswer} Bukan Jawaban yang Tepat
                        </p>
                        <p className="text-sm text-[var(--color-text)] leading-relaxed">
                          {q.optionExplanations[userAnswer]}
                        </p>
                      </div>
                    )}

                  {/* Main explanation */}
                  <div className="rounded-xl p-4 bg-indigo-500/5 border border-indigo-500/20">
                    <p className="text-xs uppercase tracking-widest text-indigo-300 mb-2">
                      Pembahasan Jawaban Benar ({q.correct})
                    </p>
                    <p className="text-sm text-[var(--color-text)] leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>

                  {/* Other distractor explanations if present */}
                  {(() => {
                    const keys = (["A", "B", "C", "D"] as const).filter(
                      (k) =>
                        k !== q.correct &&
                        k !== userAnswer &&
                        q.optionExplanations?.[k]
                    );
                    if (keys.length === 0) return null;
                    return (
                      <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]">
                        <summary className="px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--color-text-soft)] cursor-pointer hover:text-[var(--color-text)]">
                          Lihat penjelasan opsi lain ({keys.length})
                        </summary>
                        <div className="px-4 pb-3 space-y-2">
                          {keys.map((k) => (
                            <div
                              key={k}
                              className="flex gap-2 text-xs text-[var(--color-text-soft)]"
                            >
                              <span className="w-5 h-5 rounded-md bg-[var(--color-bg-soft)] text-[var(--color-text)] flex items-center justify-center font-serif shrink-0">
                                {k}
                              </span>
                              <span>{q.optionExplanations?.[k]}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })()}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
