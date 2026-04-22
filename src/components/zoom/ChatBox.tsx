"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ChatBox({
  initial,
  me = "Rafa",
}: {
  initial: ChatMessage[];
  me?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = new Date();
    setMessages((m) => [
      ...m,
      {
        id: `me_${Date.now()}`,
        user: me,
        message: trimmed,
        time: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      },
    ]);
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-soft)]">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Chat Room</p>
          <p className="text-xs text-[var(--color-text-soft)]">
            Disiarkan ke semua peserta
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          online
        </span>
      </div>

      <div
        ref={scroller}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[520px]"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.user === me;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className={cn("flex gap-3 items-end", mine && "flex-row-reverse")}
              >
                <Avatar name={m.user} size={30} />
                <div className={cn("flex flex-col gap-1 max-w-[75%]", mine && "items-end")}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs font-medium",
                      mine ? "text-amber-200" : m.isTeacher ? "text-indigo-200" : "text-[var(--color-text-soft)]"
                    )}>
                      {m.user}
                      {m.isTeacher && (
                        <span className="ml-1.5 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                          guru
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-mute)]">{m.time}</span>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                      mine
                        ? "bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/25 text-amber-50 rounded-br-sm"
                        : m.isTeacher
                        ? "bg-indigo-500/15 border border-indigo-500/25 text-[var(--color-text)] rounded-bl-sm"
                        : "bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-sm"
                    )}
                  >
                    {m.message}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-[var(--color-border-soft)]">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 focus-within:border-indigo-500/50">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Tulis pesan ke kelas..."
            className="flex-1 h-10 bg-transparent outline-none text-sm placeholder:text-[var(--color-text-mute)]"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-[var(--color-text)] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
