import { describe, it, expect } from "vitest";
import { toCurl, toJsFetch, toPythonRequests, toNodeAxios } from "@/lib/codegen";

const sample = {
  method: "POST",
  url: "https://api.example.com/users",
  headers: { "Content-Type": "application/json", Authorization: "Bearer abc123" },
  body: '{"name":"Ada"}',
};

describe("toCurl", () => {
  it("includes method, url, headers, and body", () => {
    const result = toCurl(sample);
    expect(result).toContain("curl -X POST");
    expect(result).toContain("https://api.example.com/users");
    expect(result).toContain("-H 'Content-Type: application/json'");
    expect(result).toContain("-H 'Authorization: Bearer abc123'");
    expect(result).toContain(`-d '{"name":"Ada"}'`);
  });

  it("omits -d for GET requests even if a body is present", () => {
    const result = toCurl({ ...sample, method: "GET" });
    expect(result).not.toContain("-d");
  });

  it("escapes single quotes in the URL safely", () => {
    const result = toCurl({ ...sample, url: "https://example.com/?q=o'brien" });
    expect(result).toContain(`o'\\''brien`);
  });
});

describe("toJsFetch", () => {
  it("produces a fetch call with method, headers, and body", () => {
    const result = toJsFetch(sample);
    expect(result).toContain("fetch(");
    expect(result).toContain('method: "POST"');
    expect(result).toContain('"Authorization": "Bearer abc123"');
    expect(result).toContain("body:");
  });

  it("omits body for GET", () => {
    const result = toJsFetch({ ...sample, method: "GET" });
    expect(result).not.toContain("body:");
  });
});

describe("toPythonRequests", () => {
  it("produces valid-looking Python with headers and data", () => {
    const result = toPythonRequests(sample);
    expect(result).toContain("import requests");
    expect(result).toContain("requests.request(");
    expect(result).toContain("data=data");
  });
});

describe("toNodeAxios", () => {
  it("produces an axios call with lowercase method", () => {
    const result = toNodeAxios(sample);
    expect(result).toContain('"post"');
    expect(result).toContain("axios(");
  });
});
