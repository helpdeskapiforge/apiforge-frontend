"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatFab({
  open,
  onToggle,
  hasUnread,
}: {
  open: boolean;
  onToggle: () => void;
  hasUnread: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "group fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full",
        "border border-white/20 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
        "shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      )}
    >
      {!open && <span className="assistant-pulse absolute inset-0 -z-10 opacity-40" />}
      {!open && hasUnread && (
        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X className="h-6 w-6" />
          </motion.span>
        ) : (
          <motion.span
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="transition-transform duration-300 group-hover:rotate-12"
          >
            <Sparkles className="h-6 w-6" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
