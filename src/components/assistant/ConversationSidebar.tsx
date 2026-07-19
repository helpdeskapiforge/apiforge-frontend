"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Conversation } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (c: Conversation) => {
    setEditingId(c.id);
    setDraft(c.title);
  };

  const commitEdit = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-muted/20">
      <div className="p-2">
        <Button variant="secondary" size="sm" className="w-full justify-start gap-2" onClick={onNew}>
          <MessageSquarePlus className="h-3.5 w-3.5" /> New chat
        </Button>
      </div>
      <div className="assistant-scroll flex-1 overflow-y-auto px-2 pb-2">
        <AnimatePresence initial={false}>
          {sorted.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "group mb-1 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors",
                c.id === activeId ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
              )}
            >
              {editingId === c.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 px-1.5 text-xs"
                  />
                  <button onClick={commitEdit} className="text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onSelect(c.id)}
                    className="min-w-0 flex-1 truncate text-left"
                    title={c.title}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => startEdit(c)}
                    className="hidden shrink-0 text-muted-foreground hover:text-foreground group-hover:block"
                    title="Rename"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="hidden shrink-0 text-muted-foreground hover:text-destructive group-hover:block"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {sorted.length === 0 && (
          <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">No chats yet.</p>
        )}
      </div>
    </div>
  );
}
