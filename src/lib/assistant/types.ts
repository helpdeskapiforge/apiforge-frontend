// Independent, backend-free AI Assistant types.
// This module has ZERO dependency on the ApiForge backend, Spring Boot,
// or the existing provider architecture (src/lib/aiApi.ts). It talks
// directly to the Gemini REST API from the browser.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  /** Set when the assistant turn failed (network / API error). */
  error?: string;
  /** True while a streaming response is still being written. */
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface AssistantSettings {
  apiKey: string;
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  systemPrompt: string;
}

// The model is intentionally not user-configurable or persisted anywhere
// (no Settings UI, no localStorage) — it's a fixed implementation detail.
// Using the "-latest" alias means Google keeps it pointed at a live model,
// so this needs no manual updates as Gemini model ids get retired over time.
export const DEFAULT_MODEL = "gemini-flash-latest";

export const DEFAULT_SETTINGS: AssistantSettings = {
  apiKey: "",
  model: DEFAULT_MODEL,
  temperature: 0.7,
  topP: 0.95,
  maxOutputTokens: 2048,
  systemPrompt:
    "You are a helpful, precise coding assistant embedded inside ApiForge, an API development platform. " +
    "Prefer concise, correct answers. Use Markdown, and put code in fenced code blocks with a language tag.",
};

export type AssistantErrorKind =
  | "invalid_key"
  | "rate_limit"
  | "no_internet"
  | "aborted"
  | "blocked"
  | "unknown";

export class AssistantError extends Error {
  kind: AssistantErrorKind;
  constructor(kind: AssistantErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "AssistantError";
  }
}

export const QUICK_SUGGESTIONS: string[] = [
  "Explain JWT Authentication",
  "Generate a Spring Boot CRUD controller",
  "Write a React custom hook",
  "Generate a SQL query",
  "Explain this Docker Compose file",
  "Optimize this Java code",
  "Create a REST API design",
  "Generate a regex",
  "Debug this stack trace",
];
