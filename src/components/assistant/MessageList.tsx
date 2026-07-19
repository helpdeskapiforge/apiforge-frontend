"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ChatMessage } from "@/lib/assistant/types";
import { MessageBubble } from "./MessageBubble";

export function MessageList({
  messages,
  isGenerating,
  onRegenerate,
}: {
  messages: ChatMessage[];
  isGenerating: boolean;
  onRegenerate: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (!autoScroll) return;
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(distanceFromBottom < 80);
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const showTypingIndicator =
    isGenerating && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.content;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="assistant-scroll flex-1 space-y-4 overflow-y-auto px-3.5 py-4"
    >
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isLast={m.id === lastAssistantId}
          onRegenerate={onRegenerate}
        />
      ))}
      {showTypingIndicator && (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
