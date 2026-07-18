export interface SnippetRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

function escapeForShellSingleQuotes(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

export function toCurl(req: SnippetRequest): string {
  const parts = [`curl -X ${req.method} '${escapeForShellSingleQuotes(req.url)}'`];
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!key) continue;
    parts.push(`  -H '${escapeForShellSingleQuotes(key)}: ${escapeForShellSingleQuotes(value)}'`);
  }
  if (req.body && !["GET", "HEAD"].includes(req.method.toUpperCase())) {
    parts.push(`  -d '${escapeForShellSingleQuotes(req.body)}'`);
  }
  return parts.join(" \\\n");
}

export function toJsFetch(req: SnippetRequest): string {
  const hasBody = !!req.body && !["GET", "HEAD"].includes(req.method.toUpperCase());
  const headersLiteral = JSON.stringify(req.headers || {}, null, 2);
  return [
    `fetch(${JSON.stringify(req.url)}, {`,
    `  method: ${JSON.stringify(req.method)},`,
    `  headers: ${indent(headersLiteral, 2)},`,
    hasBody ? `  body: ${JSON.stringify(req.body)},` : null,
    `})`,
    `  .then((res) => res.json())`,
    `  .then((data) => console.log(data));`,
  ].filter(Boolean).join("\n");
}

export function toPythonRequests(req: SnippetRequest): string {
  const hasBody = !!req.body && !["GET", "HEAD"].includes(req.method.toUpperCase());
  const lines = [
    `import requests`,
    ``,
    `url = ${JSON.stringify(req.url)}`,
    `headers = ${pythonDict(req.headers || {})}`,
  ];
  if (hasBody) lines.push(`data = ${JSON.stringify(req.body)}`);
  lines.push(``);
  lines.push(`response = requests.request(${JSON.stringify(req.method)}, url, headers=headers${hasBody ? ", data=data" : ""})`);
  lines.push(``);
  lines.push(`print(response.status_code)`);
  lines.push(`print(response.text)`);
  return lines.join("\n");
}

export function toNodeAxios(req: SnippetRequest): string {
  const hasBody = !!req.body && !["GET", "HEAD"].includes(req.method.toUpperCase());
  return [
    `const axios = require('axios');`,
    ``,
    `axios({`,
    `  method: ${JSON.stringify(req.method.toLowerCase())},`,
    `  url: ${JSON.stringify(req.url)},`,
    `  headers: ${indent(JSON.stringify(req.headers || {}, null, 2), 2)},`,
    hasBody ? `  data: ${JSON.stringify(req.body)},` : null,
    `})`,
    `  .then((res) => console.log(res.data))`,
    `  .catch((err) => console.error(err));`,
  ].filter(Boolean).join("\n");
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text.split("\n").map((line, i) => (i === 0 ? line : pad + line)).join("\n");
}

function pythonDict(obj: Record<string, string>): string {
  const entries = Object.entries(obj).map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  return entries.length ? `{\n${entries.join(",\n")}\n}` : "{}";
}

export const SNIPPET_LANGUAGES = [
  { id: "curl", label: "cURL", generate: toCurl },
  { id: "js-fetch", label: "JavaScript (fetch)", generate: toJsFetch },
  { id: "node-axios", label: "Node.js (axios)", generate: toNodeAxios },
  { id: "python-requests", label: "Python (requests)", generate: toPythonRequests },
] as const;
