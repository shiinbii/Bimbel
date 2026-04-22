import type { Question } from "./types";

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

/** Fisher–Yates shuffle — returns a NEW array, does not mutate. */
export function shuffleArray<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Shuffle the 4 multiple-choice options and re-key (A/B/C/D),
 * remapping the `correct` key + per-option explanations to follow the answer text.
 */
export function shuffleQuestionOptions(q: Question): Question {
  const correctOption = q.options.find((o) => o.key === q.correct);
  if (!correctOption) return q;

  // Remember original per-option explanations indexed by the option TEXT,
  // so they can follow the option when positions change.
  const explByText = new Map<string, string>();
  if (q.optionExplanations) {
    for (const o of q.options) {
      const exp = q.optionExplanations[o.key];
      if (exp) explByText.set(o.text, exp);
    }
  }

  const shuffled = shuffleArray(q.options);
  const newOptions = shuffled.map((o, i) => ({
    key: OPTION_KEYS[i] ?? "A",
    text: o.text,
  }));
  const newCorrect =
    newOptions.find((o) => o.text === correctOption.text)?.key ?? "A";

  let newOptionExplanations: Question["optionExplanations"];
  if (explByText.size > 0) {
    newOptionExplanations = {};
    for (const o of newOptions) {
      const exp = explByText.get(o.text);
      if (exp) newOptionExplanations[o.key] = exp;
    }
  }

  return {
    ...q,
    options: newOptions,
    correct: newCorrect,
    ...(newOptionExplanations ? { optionExplanations: newOptionExplanations } : {}),
  };
}

export interface BuildAttemptInput {
  bank: Question[];
  questionsPerAttempt: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

/**
 * Build one attempt set from a bank:
 * - pick N random questions (if shuffleQuestions) or first N
 * - optionally shuffle A/B/C/D per question
 * Returns fresh Question[] that is safe to render & score.
 */
export function buildAttemptQuestions({
  bank,
  questionsPerAttempt,
  shuffleQuestions,
  shuffleOptions,
}: BuildAttemptInput): Question[] {
  if (!Array.isArray(bank) || bank.length === 0) return [];
  const n = Math.max(1, Math.min(questionsPerAttempt || bank.length, bank.length));
  const picked = shuffleQuestions ? shuffleArray(bank).slice(0, n) : bank.slice(0, n);
  return shuffleOptions
    ? picked.map((q) => shuffleQuestionOptions(q))
    : picked.map((q) => ({ ...q, options: q.options.map((o) => ({ ...o })) }));
}

/** Rough estimate of distinct attempts possible — used for display. */
export function estimateCombinations(
  bankSize: number,
  questionsPerAttempt: number,
  shuffleOptionsEnabled: boolean
): string {
  if (bankSize <= 0 || questionsPerAttempt <= 0) return "0";
  const n = Math.min(questionsPerAttempt, bankSize);
  // C(bank, n) × n! × (24^n if option-shuffle)   (24 = 4!)
  // Use log10 to avoid overflow.
  let logPerm = 0;
  // log10(bankSize! / (bankSize-n)!) = sum log10(bankSize - i) for i in [0, n)
  for (let i = 0; i < n; i++) {
    logPerm += Math.log10(bankSize - i);
  }
  if (shuffleOptionsEnabled) {
    logPerm += n * Math.log10(24);
  }
  const exp = Math.floor(logPerm);
  const mantissa = Math.pow(10, logPerm - exp);
  if (exp < 3) return `~${Math.round(mantissa * Math.pow(10, exp))}`;
  if (exp < 21) {
    const names = ["", "K", "M", "B", "T", "Q", "Qi", "Sx"];
    const group = Math.floor(exp / 3);
    const scaled = mantissa * Math.pow(10, exp - group * 3);
    return `~${scaled.toFixed(1)}${names[group] ?? `×10^${exp}`}`;
  }
  return `~${mantissa.toFixed(2)}×10^${exp}`;
}
