import api from "@/lib/api";

// Mirrors the backend's web/dto/response records under com.apiplatform.web.dto.response
// (AIGenerationResponse, PostmanTestResponse, JsonValidationResponse, AIProviderStatusResponse).

export interface AIGenerationResult {
  id: number;
  feature: string;
  provider: string;
  model: string | null;
  result: string;
  tokensUsed: number | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface PostmanTestResult {
  id: number | null;
  provider: string;
  model: string | null;
  deterministicAssertions: string;
  aiSuggestedAssertions: string | null;
  combinedScript: string;
}

export interface JsonIssue {
  path: string;
  message: string;
}

export interface JsonValidationResult {
  syntaxValid: boolean;
  structurallyValid: boolean;
  issues: JsonIssue[];
  explanation: string | null;
  suggestedFix: string | null;
}

export interface AIProviderInfo {
  name: string;
  available: boolean;
  model: string | null;
}

export interface AIProviderStatus {
  providers: AIProviderInfo[];
  activeProvider: string | null;
}

export type MockDataMode = "SIMPLE" | "NESTED" | "LARGE" | "EDGE_CASES" | "INVALID" | "REALISTIC";

export type SqlDialect = "MySQL" | "PostgreSQL" | "SQLite";

export async function generateCurl(description: string, baseUrl?: string, authHint?: string): Promise<AIGenerationResult> {
  const res = await api.post("/v1/ai/curl", { description, baseUrl, authHint });
  return res.data;
}

export async function generateRegex(description: string): Promise<AIGenerationResult> {
  const res = await api.post("/v1/ai/regex", { description });
  return res.data;
}

export async function generateSql(description: string, dialect: SqlDialect): Promise<AIGenerationResult> {
  const res = await api.post("/v1/ai/sql", { description, dialect });
  return res.data;
}

export async function explainError(logText: string, context?: string): Promise<AIGenerationResult> {
  const res = await api.post("/v1/ai/explain-error", { logText, context });
  return res.data;
}

export async function generatePostmanTests(
  method: string,
  url: string,
  statusCode: number | undefined,
  responseBody: string
): Promise<PostmanTestResult> {
  const res = await api.post("/v1/ai/postman-tests", { method, url, statusCode, responseBody });
  return res.data;
}

export async function generateMockData(description: string, mode: MockDataMode, count?: number): Promise<AIGenerationResult> {
  const res = await api.post("/v1/ai/mock-data", { description, mode, count });
  return res.data;
}

export async function validateJson(json: string, expectedSchema?: string): Promise<JsonValidationResult> {
  const res = await api.post("/v1/ai/json-validate", { json, expectedSchema });
  return res.data;
}

export async function getAIHistory(page = 0, size = 30): Promise<{ data: AIGenerationResult[]; totalElements: number; hasNext: boolean }> {
  const res = await api.get("/v1/ai/history", { params: { page, size } });
  return res.data;
}

export async function getAIProviderStatus(): Promise<AIProviderStatus> {
  const res = await api.get("/v1/ai/providers/status");
  return res.data;
}
