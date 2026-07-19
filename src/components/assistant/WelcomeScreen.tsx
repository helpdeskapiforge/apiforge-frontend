"use client";

import { motion } from "framer-motion";
import { Sparkles, KeyRound } from "lucide-react";
import { QUICK_SUGGESTIONS } from "@/lib/assistant/types";

export function WelcomeScreen({
  onPick,
  hasKey,
}: {
  onPick: (text: string) => void;
  hasKey: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg"
      >
        <Sparkles className="h-7 w-7" />
      </motion.div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold tracking-tight">Ask the AI Assistant</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Powered by Gemini, running entirely in your browser. Ask about code,
          APIs, debugging, or anything else — no backend required.
        </p>
      </div>

      {!hasKey ? (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <KeyRound className="h-3.5 w-3.5" /> Assistant is currently unavailable
          </div>
          <p className="max-w-[220px]">Ask an administrator to configure it.</p>
        </div>
      ) : (
        <div className="grid w-full max-w-sm grid-cols-1 gap-2">
          {QUICK_SUGGESTIONS.slice(0, 6).map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              onClick={() => onPick(s)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-left text-xs text-foreground/90 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {s}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
