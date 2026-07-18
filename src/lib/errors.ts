import { AxiosError } from "axios";

/**
 * Every error response from the APIForge backend now has this shape
 * (see GlobalExceptionHandler / ApiError on the backend):
 *
 * {
 *   timestamp: string;
 *   status: number;
 *   error: string;
 *   message: string;
 *   path: string;
 *   fieldErrors?: Record<string, string>;
 * }
 */
export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Pulls a clean, user-facing message out of an axios/fetch error, no matter what
 * shape it comes in. Falls back gracefully for network errors, rate limiting, and
 * anything unexpected, instead of ever showing a raw JSON blob or "[object Object]".
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;

  const axiosErr = error as AxiosError<ApiErrorBody>;

  if (axiosErr.response) {
    const { status, data } = axiosErr.response;

    if (status === 429) {
      return data?.message || "Too many attempts. Please wait a moment and try again.";
    }
    if (status === 401) {
      return data?.message || "Your session has expired. Please sign in again.";
    }
    if (status === 403) {
      return data?.message || "You don't have permission to do that.";
    }
    if (data?.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
      const [firstField, firstMessage] = Object.entries(data.fieldErrors)[0];
      return `${firstField}: ${firstMessage}`;
    }
    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }
  }

  if (axiosErr.request && !axiosErr.response) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/** Returns per-field validation messages, if the backend sent any (400 responses). */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  return axiosErr?.response?.data?.fieldErrors ?? null;
}

/** True if the error represents a rate-limited request (HTTP 429). */
export function isRateLimited(error: unknown): boolean {
  const axiosErr = error as AxiosError<ApiErrorBody>;
  return axiosErr?.response?.status === 429;
}
