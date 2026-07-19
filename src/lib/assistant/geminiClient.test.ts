import { describe, it, expect, vi, afterEach } from "vitest";
import { streamGeminiResponse } from "./geminiClient";
import { DEFAULT_SETTINGS } from "./types";

/**
 * Builds a fake `Response` whose body streams the given raw SSE chunks
 * exactly as given — no extra separators are added, so tests can control
 * precisely whether the final event is followed by a blank line or not.
 */
function fakeStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("streamGeminiResponse", () => {
  it("delivers the final event even when the stream closes without a trailing blank line", async () => {
    // Regression test: Gemini can close the connection right after its last
    // `data: {...}` event with no trailing "\n\n" separator. The parser must
    // not silently drop that event.
    const body =
      'data: {"candidates":[{"content":{"parts":[{"text":"Hello! Welcome to ApiForge."}]}}]}';
    vi.spyOn(globalThis, "fetch").mockResolvedValue(fakeStreamResponse([body]));

    let finalText = "";
    let sawError = false;

    await streamGeminiResponse(
      { ...DEFAULT_SETTINGS, apiKey: "test-key" },
      [],
      "hi",
      {
        onChunk: (_delta, full) => {
          finalText = full;
        },
        onDone: (full) => {
          finalText = full;
        },
        onError: () => {
          sawError = true;
        },
      },
      new AbortController().signal
    );

    expect(sawError).toBe(false);
    expect(finalText).toBe("Hello! Welcome to ApiForge.");
  });

  it("still works when events are properly separated by blank lines across multiple reads", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      fakeStreamResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":", world."}]}}]}\n\n',
      ])
    );

    let finalText = "";
    await streamGeminiResponse(
      { ...DEFAULT_SETTINGS, apiKey: "test-key" },
      [],
      "hi",
      {
        onChunk: () => {},
        onDone: (full) => {
          finalText = full;
        },
        onError: () => {
          throw new Error("should not error");
        },
      },
      new AbortController().signal
    );

    expect(finalText).toBe("Hello, world.");
  });

  it("ignores empty-text thought-signature-only events without breaking the real content", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      fakeStreamResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Hi there."}]}}]}\n\n' +
          'data: {"candidates":[{"content":{"parts":[{"text":"","thoughtSignature":"abc"}]}}]}',
      ])
    );

    let finalText = "";
    await streamGeminiResponse(
      { ...DEFAULT_SETTINGS, apiKey: "test-key" },
      [],
      "hi",
      {
        onChunk: () => {},
        onDone: (full) => {
          finalText = full;
        },
        onError: () => {
          throw new Error("should not error");
        },
      },
      new AbortController().signal
    );

    expect(finalText).toBe("Hi there.");
  });
});
