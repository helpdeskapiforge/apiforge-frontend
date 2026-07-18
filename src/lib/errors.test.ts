import { describe, it, expect } from "vitest";
import { getErrorMessage, getFieldErrors, isRateLimited } from "@/lib/errors";

function axiosErrorLike(status: number, data?: Record<string, unknown>) {
  return {
    response: { status, data },
    request: {},
    isAxiosError: true,
  };
}

function networkErrorLike() {
  return {
    request: {},
    response: undefined,
    isAxiosError: true,
  };
}

describe("getErrorMessage", () => {
  it("returns the backend's message field when present", () => {
    const err = axiosErrorLike(400, { message: "Workspace name must not be blank." });
    expect(getErrorMessage(err)).toBe("Workspace name must not be blank.");
  });

  it("returns a field-specific message when fieldErrors are present", () => {
    const err = axiosErrorLike(400, {
      message: "Validation failed for one or more fields.",
      fieldErrors: { email: "must be a valid email" },
    });
    expect(getErrorMessage(err)).toBe("email: must be a valid email");
  });

  it("gives a dedicated message for 429 (rate limited)", () => {
    const err = axiosErrorLike(429, {});
    expect(getErrorMessage(err)).toMatch(/too many attempts/i);
  });

  it("gives a dedicated message for 401", () => {
    const err = axiosErrorLike(401, {});
    expect(getErrorMessage(err)).toMatch(/session has expired/i);
  });

  it("gives a dedicated message for 403", () => {
    const err = axiosErrorLike(403, {});
    expect(getErrorMessage(err)).toMatch(/don't have permission/i);
  });

  it("falls back to a network-error message when there's no response at all", () => {
    expect(getErrorMessage(networkErrorLike())).toMatch(/couldn't reach the server/i);
  });

  it("falls back to the provided default when nothing usable is found", () => {
    const err = axiosErrorLike(500, {});
    expect(getErrorMessage(err, "Custom fallback.")).toBe("Custom fallback.");
  });

  it("never returns a raw JSON blob or [object Object]", () => {
    const err = axiosErrorLike(400, { message: "Something specific went wrong." });
    const result = getErrorMessage(err);
    expect(result).not.toContain("{");
    expect(result).not.toBe("[object Object]");
  });

  it("handles a plain Error instance", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("handles null/undefined gracefully", () => {
    expect(getErrorMessage(null)).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});

describe("getFieldErrors", () => {
  it("extracts field errors when present", () => {
    const err = axiosErrorLike(400, { fieldErrors: { name: "must not be blank" } });
    expect(getFieldErrors(err)).toEqual({ name: "must not be blank" });
  });

  it("returns null when there are none", () => {
    const err = axiosErrorLike(500, {});
    expect(getFieldErrors(err)).toBeNull();
  });
});

describe("isRateLimited", () => {
  it("is true only for 429", () => {
    expect(isRateLimited(axiosErrorLike(429))).toBe(true);
    expect(isRateLimited(axiosErrorLike(400))).toBe(false);
    expect(isRateLimited(networkErrorLike())).toBe(false);
  });
});
