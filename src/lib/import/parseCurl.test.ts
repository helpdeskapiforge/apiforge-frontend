import { describe, it, expect } from "vitest";
import { parseCurl } from "@/lib/import/parseCurl";

describe("parseCurl", () => {
  it("parses a simple GET", () => {
    const result = parseCurl("curl https://api.example.com/users");
    expect(result.method).toBe("GET");
    expect(result.url).toBe("https://api.example.com/users");
  });

  it("parses an explicit method flag", () => {
    const result = parseCurl("curl -X DELETE https://api.example.com/users/1");
    expect(result.method).toBe("DELETE");
  });

  it("defaults to POST when -d is present without an explicit method (matches real curl behavior)", () => {
    const result = parseCurl(`curl https://api.example.com/users -d '{"name":"Ada"}'`);
    expect(result.method).toBe("POST");
    expect(result.body).toBe('{"name":"Ada"}');
  });

  it("parses multiple headers", () => {
    const result = parseCurl(
      `curl https://api.example.com/users -H "Content-Type: application/json" -H "Authorization: Bearer xyz"`
    );
    expect(result.headers["Content-Type"]).toBe("application/json");
    expect(result.headers["Authorization"]).toBe("Bearer xyz");
  });

  it("handles a realistic multi-line copy-pasted command with backslash continuations", () => {
    const curl = `curl 'https://api.example.com/orders' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: */*' \\
  --data-raw '{"id":42}'`;
    const result = parseCurl(curl);
    expect(result.url).toBe("https://api.example.com/orders");
    expect(result.headers["Content-Type"]).toBe("application/json");
    expect(result.body).toBe('{"id":42}');
  });

  it("handles basic auth via -u", () => {
    const result = parseCurl(`curl https://api.example.com/secret -u admin:hunter2`);
    expect(result.headers["Authorization"]).toMatch(/^Basic /);
  });

  it("ignores unrecognized boolean flags like --compressed and -k", () => {
    const result = parseCurl(`curl --compressed -k https://api.example.com/ping`);
    expect(result.url).toBe("https://api.example.com/ping");
    expect(result.method).toBe("GET");
  });

  it("derives a request name from the last URL path segment", () => {
    const result = parseCurl("curl https://api.example.com/v1/users/42");
    expect(result.name).toBe("42");
  });

  it("throws a clear error when no URL is present", () => {
    expect(() => parseCurl("curl -X GET -H 'Accept: application/json'")).toThrow(/URL/i);
  });
});
