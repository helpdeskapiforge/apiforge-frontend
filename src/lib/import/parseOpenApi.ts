export interface ParsedOpenApiRequest {
  name: string;
  method: string;
  path: string;
  summary?: string;
  headers: Record<string, string>;
  body?: string;
}

export interface ParsedOpenApiResult {
  title: string;
  baseUrl: string;
  requests: ParsedOpenApiRequest[];
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

/**
 * Parses an OpenAPI 3.x document (JSON only -- YAML support is a follow-up; most
 * spec authoring tools can export JSON even if they edit YAML, so this covers the
 * common case without pulling in a YAML parser dependency for this pass) into a flat
 * list of requests, one per operation. Deliberately does not attempt full JSON Schema
 * -> example-body generation (that's a large, separate feature); it generates a
 * minimal stub body for operations with a requestBody instead, which is a reasonable
 * starting point the user edits from.
 */
export function parseOpenApi(rawJson: string): ParsedOpenApiResult {
  let spec: any;
  try {
    spec = JSON.parse(rawJson);
  } catch {
    throw new Error("That doesn't look like valid JSON. (YAML OpenAPI specs aren't supported yet -- export as JSON first.)");
  }

  if (!spec.openapi && !spec.swagger) {
    throw new Error("This doesn't look like an OpenAPI/Swagger document (missing \"openapi\" or \"swagger\" field).");
  }
  if (!spec.paths || typeof spec.paths !== "object") {
    throw new Error("This OpenAPI document has no \"paths\" defined -- nothing to import.");
  }

  const title = spec.info?.title || "Imported API";
  const baseUrl = deriveBaseUrl(spec);

  const requests: ParsedOpenApiRequest[] = [];

  for (const [path, pathItem] of Object.entries<any>(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const headers: Record<string, string> = {};
      const params: any[] = [...(pathItem.parameters || []), ...(operation.parameters || [])];
      for (const param of params) {
        if (param.in === "header") {
          headers[param.name] = param.example ?? `{{${param.name}}}`;
        }
      }

      let body: string | undefined;
      if (operation.requestBody) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
        body = stubBodyFromRequestBody(operation.requestBody);
      }

      // Path params become {{variables}} -- resolved via the environment system,
      // consistent with how the rest of APIForge already handles variables.
      const templatedPath = path.replace(/\{([^}]+)\}/g, (_match, name) => `{{${name}}}`);

      requests.push({
        name: operation.operationId || operation.summary || `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        path: templatedPath,
        summary: operation.summary,
        headers,
        body,
      });
    }
  }

  if (requests.length === 0) {
    throw new Error("No operations found in this OpenAPI document's paths.");
  }

  return { title, baseUrl, requests };
}

function deriveBaseUrl(spec: any): string {
  if (Array.isArray(spec.servers) && spec.servers[0]?.url) {
    return spec.servers[0].url;
  }
  if (spec.host) {
    const scheme = Array.isArray(spec.schemes) && spec.schemes[0] ? spec.schemes[0] : "https";
    return `${scheme}://${spec.host}${spec.basePath || ""}`;
  }
  return "{{baseUrl}}";
}

function stubBodyFromRequestBody(requestBody: any): string {
  const jsonContent = requestBody?.content?.["application/json"];
  const schema = jsonContent?.schema;
  if (!schema) return "{}";

  try {
    return JSON.stringify(stubFromSchema(schema), null, 2);
  } catch {
    return "{}";
  }
}

/** Produces a minimal, plausible example value from a JSON Schema fragment. */
function stubFromSchema(schema: any, depth = 0): any {
  if (depth > 5 || !schema) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;

  switch (schema.type) {
    case "object": {
      const result: Record<string, any> = {};
      const props = schema.properties || {};
      for (const [key, propSchema] of Object.entries<any>(props)) {
        result[key] = stubFromSchema(propSchema, depth + 1);
      }
      return result;
    }
    case "array":
      return [stubFromSchema(schema.items, depth + 1)];
    case "string":
      return schema.enum?.[0] ?? "string";
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return false;
    default:
      return null;
  }
}
