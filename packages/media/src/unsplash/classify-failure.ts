import type { UnsplashError } from "./types";

const REMAINING_HEADER = "x-ratelimit-remaining";

function isExhausted(headers: Headers): boolean {
  return headers.get(REMAINING_HEADER) === "0";
}

export function classifyStatus(status: number, headers: Headers): UnsplashError {
  if (status === 401) {
    return { code: "UNAUTHORIZED", message: "Unsplash rejected the access key. Check UNSPLASH_ACCESS_KEY." };
  }
  if (status === 429 || (status === 403 && isExhausted(headers))) {
    return { code: "RATE_LIMITED", message: "Unsplash rate limit reached. Try again later." };
  }
  if (status === 403) {
    return { code: "FORBIDDEN", message: "Unsplash refused this request. The access key may lack permission." };
  }
  return { code: "PROVIDER_ERROR", message: `Unsplash answered with HTTP ${status}.` };
}

export function isTimeout(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export function shouldCooldown(error: UnsplashError): boolean {
  return error.code === "RATE_LIMITED" || error.code === "UNAUTHORIZED";
}
