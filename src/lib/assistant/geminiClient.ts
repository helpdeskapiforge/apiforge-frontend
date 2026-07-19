import { AssistantError, AssistantSettings, ChatMessage } from "./types";

// This client speaks directly to Google's public Gemini REST API from the
// browser. It intentionally never touches ApiForge's backend, never imports
// `@/lib/api`, and has no knowledge of the Spring Boot provider architecture.
// It works even if the ApiForge backend is completely offline.

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
  text: string;
}
interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

function toGeminiHistory(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((m) => !m.error || m.content)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
}

function classifyHttpError(status: number, body: string): AssistantError {
  let message = body;
  try {
    const parsed = JSON.parse(body);
    message = parsed?.error?.message || body;
  } catch {
    // not JSON, keep raw body
  }

  if (status === 400 && /api key not valid|api_key_invalid/i.test(message)) {
    return new AssistantError("invalid_key", "Your Gemini API key looks invalid.");
  }
  if (status === 403) {
    return new AssistantError(
      "invalid_key",
      "Gemini rejected this API key (403). Check that it's active and unrestricted."
    );
  }
  if (status === 429) {
    return new AssistantError(
      "rate_limit",
      "You've hit Gemini's rate limit. Wait a moment and try again."
    );
  }
  if (status >= 500) {
    return new AssistantError(
      "unknown",
      "Gemini's servers had a hiccup. Please retry."
    );
  }
  if (status === 404 && /no longer available|not found/i.test(message)) {
    return new AssistantError(
      "unknown",
      "This model has been retired by Google. Open Assistant settings and pick a different model, then try again."
    );
  }
  return new AssistantError("unknown", message || `Request failed (${status}).`);
}

export interface StreamCallbacks {
  onChunk: (deltaText: string, fullText: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: AssistantError) => void;
}

/**
 * Streams a Gemini response token-by-token via Server-Sent Events, appending
 * `userText` as the newest turn on top of prior `history`.
 */
export async function streamGeminiResponse(
  settings: AssistantSettings,
  history: ChatMessage[],
  userText: string,
  callbacks: StreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  if (!settings.apiKey.trim()) {
    callbacks.onError(
      new AssistantError(
        "invalid_key",
        "Add your Gemini API key in Assistant settings to start chatting."
      )
    );
    return;
  }

  const contents: GeminiContent[] = [
    ...toGeminiHistory(history),
    { role: "user", parts: [{ text: userText }] },
  ];

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: settings.temperature,
      topP: settings.topP,
      maxOutputTokens: settings.maxOutputTokens,
    },
  };
  if (settings.systemPrompt.trim()) {
    body.systemInstruction = { parts: [{ text: settings.systemPrompt }] };
  }

  const url = `${API_ROOT}/models/${encodeURIComponent(
    settings.model
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(settings.apiKey)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal.aborted) {
      callbacks.onError(new AssistantError("aborted", "Generation stopped."));
      return;
    }
    callbacks.onError(
      new AssistantError(
        "no_internet",
        "Couldn't reach Gemini. Check your internet connection."
      )
    );
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    callbacks.onError(classifyHttpError(response.status, text));
    return;
  }

  if (!response.body) {
    // Fallback for environments without streaming body support.
    const json = await response.json().catch(() => null);
    const text = extractText(json);
    if (text) {
      callbacks.onChunk(text, text);
      callbacks.onDone(text);
    } else {
      callbacks.onError(new AssistantError("unknown", "Empty response from Gemini."));
    }
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let blocked = false;

  // Parses a single raw SSE event ("data: {...}") and folds any text delta
  // into `full`, invoking onChunk. Shared between the main read loop and the
  // end-of-stream flush below so both paths behave identically.
  const processEvent = (rawEvent: string) => {
    const line = rawEvent.trim();
    if (!line.startsWith("data:")) return;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr || jsonStr === "[DONE]") return;
    try {
      const parsed = JSON.parse(jsonStr);
      const finishReason = parsed?.candidates?.[0]?.finishReason;
      if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
        blocked = true;
      }
      const delta = extractText(parsed);
      if (delta) {
        full += delta;
        callbacks.onChunk(delta, full);
      }
    } catch {
      // ignore malformed partial JSON line
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split on either CRLF-CRLF or LF-LF: SSE technically allows either
      // line ending, and normalizing here avoids silently failing to split
      // on a delimiter the server didn't actually use.
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? "";

      for (const evt of events) {
        processEvent(evt);
      }
    }
  } catch {
    if (signal.aborted) {
      callbacks.onDone(full);
      return;
    }
    callbacks.onError(
      new AssistantError("no_internet", "Connection to Gemini was interrupted.")
    );
    return;
  }

  // The stream can close right after its final event without a trailing
  // blank-line separator (common for short responses) — whatever is left
  // in `buffer` at that point is a complete, unflushed event, not a
  // partial one, so process it instead of discarding it.
  if (buffer.trim()) {
    processEvent(buffer);
  }

  if (blocked && !full) {
    callbacks.onError(
      new AssistantError(
        "blocked",
        "Gemini declined to answer that (safety filters)."
      )
    );
    return;
  }

  callbacks.onDone(full);
}

function extractText(parsed: unknown): string {
  try {
    const p = parsed as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const parts = p?.candidates?.[0]?.content?.parts ?? [];
    return parts.map((part) => part.text ?? "").join("");
  } catch {
    return "";
  }
}
