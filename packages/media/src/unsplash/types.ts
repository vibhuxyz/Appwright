import type { UnsplashSearchResponse } from "@repo/contracts";

export type UnsplashErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_RESPONSE";

export interface UnsplashError {
  readonly code: UnsplashErrorCode;
  readonly message: string;
}

export type UnsplashResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: UnsplashError };

export interface UnsplashSearchPage extends UnsplashSearchResponse {
  readonly skipped: number;
}

export type UnsplashFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
