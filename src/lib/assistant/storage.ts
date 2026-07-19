import { AssistantSettings, Conversation, DEFAULT_SETTINGS } from "./types";

const CONVERSATIONS_KEY = "apiforge.assistant.conversations.v1";
const ACTIVE_ID_KEY = "apiforge.assistant.activeId.v1";

const isBrowser = typeof window !== "undefined";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadConversations(): Conversation[] {
  if (!isBrowser) return [];
  return safeParse<Conversation[]>(localStorage.getItem(CONVERSATIONS_KEY), []);
}

export function saveConversations(conversations: Conversation[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    // Storage full or unavailable (private browsing) — fail silently, chat still works in-memory.
  }
}

export function loadActiveId(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(ACTIVE_ID_KEY);
}

export function saveActiveId(id: string | null): void {
  if (!isBrowser) return;
  if (id) localStorage.setItem(ACTIVE_ID_KEY, id);
  else localStorage.removeItem(ACTIVE_ID_KEY);
}

/**
 * The API key and model are intentionally never read from or written to
 * localStorage, and there is no Settings UI to enter or change them — the
 * key comes solely from `NEXT_PUBLIC_GEMINI_API_KEY` (set at deploy time)
 * and the model is the fixed `DEFAULT_MODEL`. Nothing about either is ever
 * exposed in the UI.
 */
export function loadSettings(): AssistantSettings {
  const envKey = (process.env.NEXT_PUBLIC_GEMINI_API_KEY as string | undefined) || "";
  return { ...DEFAULT_SETTINGS, apiKey: envKey };
}

export function genId(): string {
  if (isBrowser && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function titleFromMessage(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "New chat";
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
}
