"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PanelLeft, Sparkles, X, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAssistantChat } from "./useAssistantChat";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { cn } from "@/lib/utils";

const MIN_W = 340;
const MIN_H = 440;
const MAX_W = 720;
const MAX_H = 860;

export function ChatWindow({ onClose }: { onClose: () => void }) {
  const {
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    isGenerating,
    settings,
    createChat,
    deleteChat,
    renameChat,
    sendMessage,
    stopGenerating,
    regenerate,
  } = useAssistantChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [size, setSize] = useState({ width: 400, height: 620 });
  const resizing = useRef(false);
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      resizing.current = true;
      startRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [size]
  );

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    const dx = startRef.current.x - e.clientX;
    const dy = startRef.current.y - e.clientY;
    setSize({
      width: Math.min(MAX_W, Math.max(MIN_W, startRef.current.w + dx)),
      height: Math.min(MAX_H, Math.max(MIN_H, startRef.current.h + dy)),
    });
  }, []);

  const onResizeEnd = useCallback((e: React.PointerEvent) => {
    resizing.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const hasKey = !!settings.apiKey.trim();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 12 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      style={{ width: size.width, height: size.height }}
      className={cn(
        "fixed bottom-24 right-5 z-50 flex origin-bottom-right overflow-hidden rounded-2xl",
        "border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl",
        "max-sm:inset-3 max-sm:bottom-3 max-sm:h-auto max-sm:w-auto"
      )}
    >
      {/* Resize handle — desktop only */}
      <div
        onPointerDown={onResizeStart}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeEnd}
        className="absolute left-0 top-0 z-20 hidden h-5 w-5 cursor-nwse-resize touch-none items-center justify-center sm:flex"
        title="Drag to resize"
      >
        <div className="h-2.5 w-2.5 rounded-sm border-l-2 border-t-2 border-muted-foreground/40" />
      </div>

      {sidebarOpen && (
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => {
            setActiveId(id);
            setSidebarOpen(false);
          }}
          onNew={() => {
            createChat();
            setSidebarOpen(false);
          }}
          onDelete={deleteChat}
          onRename={renameChat}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen((s) => !s)}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat history</TooltipContent>
            </Tooltip>
            <div className="flex min-w-0 items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate text-sm font-semibold">
                {activeConversation?.title ?? "AI Assistant"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={createChat}>
                  <RefreshCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        {activeConversation && activeConversation.messages.length > 0 ? (
          <MessageList
            messages={activeConversation.messages}
            isGenerating={isGenerating}
            onRegenerate={regenerate}
          />
        ) : (
          <WelcomeScreen hasKey={hasKey} onPick={(text) => sendMessage(text)} />
        )}

        {/* Input */}
        <div className="border-t border-border p-2.5">
          <ChatInput
            onSend={sendMessage}
            isGenerating={isGenerating}
            onStop={stopGenerating}
            disabled={!hasKey}
          />
        </div>
      </div>
    </motion.div>
  );
}
