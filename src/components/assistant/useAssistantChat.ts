"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { streamGeminiResponse } from "@/lib/assistant/geminiClient";
import {
  genId,
  loadActiveId,
  loadConversations,
  loadSettings,
  saveActiveId,
  saveConversations,
  titleFromMessage,
} from "@/lib/assistant/storage";
import {
  AssistantError,
  AssistantSettings,
  ChatMessage,
  Conversation,
} from "@/lib/assistant/types";

function newConversation(): Conversation {
  const now = Date.now();
  return { id: genId(), title: "New chat", createdAt: now, updatedAt: now, messages: [] };
}

// This hook backs `ChatWindow`, which is only ever mounted client-side
// (after the user opens the FAB) — it is never rendered during SSR, so
// reading localStorage in lazy initializers below is safe and avoids any
// hydration mismatch or "setState in effect on mount" churn.
function initialConversations(): { list: Conversation[]; activeId: string } {
  const stored = loadConversations();
  const storedActive = loadActiveId();
  if (stored.length > 0) {
    const activeId =
      storedActive && stored.some((c) => c.id === storedActive) ? storedActive : stored[0].id;
    return { list: stored, activeId };
  }
  const conv = newConversation();
  return { list: [conv], activeId: conv.id };
}

export function useAssistantChat() {
  const [{ list: initialList, activeId: initialActiveId }] = useState(initialConversations);
  const [conversations, setConversations] = useState<Conversation[]>(initialList);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  // Settings (API key + model) are fixed at load time from the env var —
  // there's no UI to change them, so this never needs to be mutable state.
  const settings: AssistantSettings = useMemo(() => loadSettings(), []);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const patchConversation = useCallback((id: string, patch: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c))
    );
  }, []);

  const patchMessage = useCallback(
    (convId: string, msgId: string, patch: Partial<ChatMessage>) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
              }
            : c
        )
      );
    },
    []
  );

  const createChat = useCallback(() => {
    const conv = newConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv.id;
  }, []);

  const deleteChat = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (id === activeId) {
          setActiveId(next[0]?.id ?? null);
          if (next.length === 0) {
            const conv = newConversation();
            setActiveId(conv.id);
            return [conv];
          }
        }
        return next;
      });
    },
    [activeId]
  );

  const renameChat = useCallback(
    (id: string, title: string) => {
      const clean = title.trim();
      if (!clean) return;
      patchConversation(id, { title: clean });
    },
    [patchConversation]
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const runAssistantTurn = useCallback(
    async (convId: string, historyBeforeUser: ChatMessage[], userText: string) => {
      const assistantMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        streaming: true,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
        )
      );
      setIsGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      await streamGeminiResponse(
        settings,
        historyBeforeUser,
        userText,
        {
          onChunk: (_delta, full) => {
            patchMessage(convId, assistantMsg.id, { content: full });
          },
          onDone: (full) => {
            patchMessage(convId, assistantMsg.id, { content: full, streaming: false });
            setIsGenerating(false);
          },
          onError: (err: AssistantError) => {
            patchMessage(convId, assistantMsg.id, {
              streaming: false,
              error: err.message,
            });
            setIsGenerating(false);
          },
        },
        controller.signal
      );
    },
    [settings, patchMessage]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || isGenerating) return;
      let convId = activeId;
      let convForHistory: Conversation | undefined;

      if (!convId) {
        const conv = newConversation();
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        convId = conv.id;
        convForHistory = conv;
      } else {
        convForHistory = conversations.find((c) => c.id === convId);
      }

      const historyBeforeUser = convForHistory?.messages ?? [];
      const isFirstMessage = historyBeforeUser.length === 0;
      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: clean,
        createdAt: Date.now(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                title: isFirstMessage ? titleFromMessage(clean) : c.title,
                messages: [...c.messages, userMsg],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      await runAssistantTurn(convId, historyBeforeUser, clean);
    },
    [activeId, conversations, isGenerating, runAssistantTurn]
  );

  const regenerate = useCallback(async () => {
    if (!activeConversation || isGenerating) return;
    const messages = activeConversation.messages;
    const lastUserIdx = [...messages].map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const lastUser = messages[lastUserIdx];
    const historyBeforeUser = messages.slice(0, lastUserIdx);
    // Drop everything after (and including) the last user turn, then redo it.
    patchConversation(activeConversation.id, { messages: historyBeforeUser });
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [...historyBeforeUser, lastUser] }
          : c
      )
    );
    await runAssistantTurn(activeConversation.id, historyBeforeUser, lastUser.content);
  }, [activeConversation, isGenerating, patchConversation, runAssistantTurn]);

  return {
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
  };
}
