"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_CHARS = 8000;

export function ChatInput({
  onSend,
  isGenerating,
  onStop,
  disabled,
}: {
  onSend: (text: string) => void;
  isGenerating: boolean;
  onStop: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    if (!value.trim() || isGenerating || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === "Escape") {
      (e.target as HTMLTextAreaElement).blur();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData("text/plain");
    if (text) setValue((prev) => (prev ? `${prev}\n${text}` : text).slice(0, MAX_CHARS));
  };

  const overLimit = value.length > MAX_CHARS;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-2xl border bg-background shadow-sm transition-colors",
        isDragging ? "border-primary ring-2 ring-primary/30" : "border-border"
      )}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/5 text-xs font-medium text-primary">
          Drop text to insert
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS + 200))}
        onKeyDown={handleKeyDown}
        onPaste={() => {
          /* native paste works out of the box on a controlled textarea */
        }}
        placeholder={disabled ? "AI Assistant is currently unavailable…" : "Message the assistant…  (Enter to send, Shift+Enter for a new line)"}
        rows={1}
        className="assistant-scroll max-h-40 w-full resize-none bg-transparent px-3.5 pb-8 pt-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2.5 pb-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled
            title="File upload coming soon"
            className="h-6 w-6 text-muted-foreground/50"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
          <span className={cn("text-[10px] tabular-nums text-muted-foreground", overLimit && "text-destructive")}>
            {value.length}/{MAX_CHARS}
          </span>
        </div>

        {isGenerating ? (
          <Button size="icon-sm" variant="destructive" className="h-7 w-7 rounded-full" onClick={onStop} title="Stop generating">
            <Square className="h-3 w-3 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            className="h-7 w-7 rounded-full"
            disabled={!value.trim() || overLimit || disabled}
            onClick={submit}
            title="Send (Enter)"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
