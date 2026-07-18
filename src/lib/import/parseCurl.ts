export interface ParsedRequest {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Parses a cURL command (as copied from a browser's "Copy as cURL", or hand-written)
 * into a request shape APIForge understands. Deliberately handles the common flags
 * only (-X/--request, -H/--header, -d/--data*, -u/--user, the bare URL) — cURL's full
 * flag surface is enormous and the long tail isn't worth chasing for this pass.
 */
export function parseCurl(input: string): ParsedRequest {
  const tokens = tokenize(input.trim());

  let method = "GET";
  let url = "";
  const headers: Record<string, string> = {};
  let body: string | undefined;
  let explicitMethod = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "curl") continue;

    if (token === "-X" || token === "--request") {
      method = (tokens[++i] || "GET").toUpperCase();
      explicitMethod = true;
    } else if (token === "-H" || token === "--header") {
      const headerLine = tokens[++i] || "";
      const idx = headerLine.indexOf(":");
      if (idx > -1) {
        const key = headerLine.slice(0, idx).trim();
        const value = headerLine.slice(idx + 1).trim();
        if (key) headers[key] = value;
      }
    } else if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
      body = tokens[++i] || "";
      if (!explicitMethod) method = "POST"; // curl's own default-with-data behavior
    } else if (token === "-u" || token === "--user") {
      const cred = tokens[++i] || "";
      headers["Authorization"] = `Basic ${typeof btoa === "function" ? btoa(cred) : Buffer.from(cred).toString("base64")}`;
    } else if (token === "-A" || token === "--user-agent") {
      headers["User-Agent"] = tokens[++i] || "";
    } else if (token.startsWith("-")) {
      // Unrecognized flag (e.g. -k, --compressed, -L) -- skip its value only if it's
      // a known value-taking flag; otherwise it's a boolean flag, move on.
      continue;
    } else if (!url) {
      url = stripSurroundingQuotes(token);
    }
  }

  if (!url) {
    throw new Error("Could not find a URL in this cURL command.");
  }

  return {
    name: deriveNameFromUrl(url),
    method,
    url,
    headers,
    body,
  };
}

/** Tokenizes a shell-like command line, respecting single/double quotes. */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === "\\" && quote === '"' && input[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "\\" && (input[i + 1] === "\n" || input[i + 1] === "\r")) {
      // Line continuation -- common in multi-line copy-pasted cURL commands.
      i++;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function stripSurroundingQuotes(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function deriveNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : parsed.hostname;
  } catch {
    return "Imported request";
  }
}
