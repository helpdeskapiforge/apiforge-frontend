import { describe, it, expect } from "vitest";
import { parseOpenApi } from "@/lib/import/parseOpenApi";

const sampleSpec = {
  openapi: "3.0.0",
  info: { title: "Pet Store" },
  servers: [{ url: "https://petstore.example.com/v1" }],
  paths: {
    "/pets": {
      get: { operationId: "listPets", summary: "List all pets" },
      post: {
        operationId: "createPet",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, age: { type: "integer" } },
              },
            },
          },
        },
      },
    },
    "/pets/{petId}": {
      get: {
        operationId: "getPet",
        parameters: [{ name: "petId", in: "path" }, { name: "X-Trace-Id", in: "header" }],
      },
    },
  },
};

describe("parseOpenApi", () => {
  it("extracts the title and base URL", () => {
    const result = parseOpenApi(JSON.stringify(sampleSpec));
    expect(result.title).toBe("Pet Store");
    expect(result.baseUrl).toBe("https://petstore.example.com/v1");
  });

  it("produces one request per operation", () => {
    const result = parseOpenApi(JSON.stringify(sampleSpec));
    expect(result.requests).toHaveLength(3);
  });

  it("converts path parameters into {{variable}} placeholders", () => {
    const result = parseOpenApi(JSON.stringify(sampleSpec));
    const getPet = result.requests.find((r) => r.name === "getPet");
    expect(getPet?.path).toBe("/pets/{{petId}}");
  });

  it("maps header parameters onto the request headers", () => {
    const result = parseOpenApi(JSON.stringify(sampleSpec));
    const getPet = result.requests.find((r) => r.name === "getPet");
    expect(getPet?.headers["X-Trace-Id"]).toBe("{{X-Trace-Id}}");
  });

  it("generates a stub JSON body from the request schema", () => {
    const result = parseOpenApi(JSON.stringify(sampleSpec));
    const createPet = result.requests.find((r) => r.name === "createPet");
    const body = JSON.parse(createPet!.body!);
    expect(body).toEqual({ name: "string", age: 0 });
  });

  it("throws a clear error for invalid JSON", () => {
    expect(() => parseOpenApi("not json")).toThrow(/valid JSON/);
  });

  it("throws a clear error when the openapi field is missing", () => {
    expect(() => parseOpenApi(JSON.stringify({ paths: {} }))).toThrow(/OpenAPI\/Swagger/);
  });

  it("throws a clear error when there are no paths", () => {
    expect(() => parseOpenApi(JSON.stringify({ openapi: "3.0.0" }))).toThrow(/paths/);
  });
});
