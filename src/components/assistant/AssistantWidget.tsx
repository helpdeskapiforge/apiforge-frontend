"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatFab } from "./ChatFab";
import { ChatWindow } from "./ChatWindow";

/**
 * Independent, backend-free floating AI assistant.
 *
 * This widget never imports `@/lib/api`, never calls the ApiForge/Spring
 * Boot backend, and keeps working even if that backend is completely
 * offline — it talks directly to Google's Gemini REST API using a key
 * the user stores locally in their browser.
 *
 * Mounted once, globally, in the root layout.
 */
export function AssistantWidget() {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    // Esc key or the X button closes the window.
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <ChatFab open={open} onToggle={() => setOpen((o) => !o)} hasUnread={false} />
      <AnimatePresence>{open && <ChatWindow onClose={handleClose} />}</AnimatePresence>
    </>
  );
}
