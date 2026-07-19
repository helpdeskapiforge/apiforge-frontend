"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Copy, RotateCcw, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/lib/assistant/types";
import { MarkdownMessage } from "./MarkdownMessage";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  isLast,
  onRegenerate,
}: {
  message: ChatMessage;
  isLast: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("group flex w-full gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}

      <div className={cn("flex min-w-0 max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "min-w-0 rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card text-card-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : message.error ? (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message.error}</span>
            </div>
          ) : (
            <>
              <MarkdownMessage content={message.content || " "} />
              {message.streaming && <span className="assistant-caret text-foreground" />}
            </>
          )}
        </div>

        {!isUser && !message.streaming && (message.content || message.error) && (
          <div className="flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100">
            {message.content && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 text-muted-foreground"
                onClick={handleCopy}
                title="Copy response"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            )}
            {isLast && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 text-muted-foreground"
                onClick={onRegenerate}
                title="Regenerate response"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </motion.div>
  );
}
