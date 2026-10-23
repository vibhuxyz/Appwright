import { UnsplashSearchQuery } from "@repo/contracts";
import type { UnsplashPhoto } from "@repo/contracts";
import { buildSearchUrl, cacheKeyFor } from "./build-search-url";
import { classifyStatus, isTimeout, shouldCooldown } from "./classify-failure";
import {
  CACHE_MAX_ENTRIES,
  CACHE_TTL_MS,
  DOWNLOAD_TIMEOUT_MS,
  RATE_LIMIT_COOLDOWN_MS,
  SEARCH_TIMEOUT_MS,
  UNSPLASH_API_VERSION,
} from "./constants";
import { Cooldown } from "./cooldown";
import { normalizePhotos, RawSearchResponse } from "./normalize-photo";
import { ResponseCache } from "./response-cache";
import type { UnsplashError, UnsplashFetch, UnsplashResult, UnsplashSearchPage } from "./types";

export interface UnsplashClientOptions {
  readonly accessKey: string | undefined;
  readonly fetchImpl?: UnsplashFetch;
  readonly now?: () => number;
}

export interface UnsplashClient {
  search(query: UnsplashSearchQuery): Promise<UnsplashResult<UnsplashSearchPage>>;
  trackDownload(photo: Pick<UnsplashPhoto, "downloadLocation">): Promise<UnsplashResult<true>>;
}

const NOT_CONFIGURED: UnsplashError = {
  code: "NOT_CONFIGURED",
  message: "Photo search is not set up. Add UNSPLASH_ACCESS_KEY on the server.",
};

function fail<T>(error: UnsplashError): UnsplashResult<T> {
  return { ok: false, error };
}

function failureFromThrown(error: unknown): UnsplashError {
  if (isTimeout(error)) return { code: "TIMEOUT", message: "Unsplash took too long to answer." };
  return { code: "PROVIDER_ERROR", message: "Could not reach Unsplash." };
}

export function createUnsplashClient(options: UnsplashClientOptions): UnsplashClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const cache = new ResponseCache<UnsplashSearchPage>(CACHE_TTL_MS, CACHE_MAX_ENTRIES);
  const cooldown = new Cooldown();

  async function call(url: URL, timeoutMs: number, accessKey: string): Promise<UnsplashResult<Response>> {
    try {
      const response = await fetchImpl(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          "Accept-Version": UNSPLASH_API_VERSION,
          Accept: "application/json",
        },
      });
      if (response.ok) return { ok: true, value: response };
      const error = classifyStatus(response.status, response.headers);
      if (shouldCooldown(error)) cooldown.start(error, now() + RATE_LIMIT_COOLDOWN_MS);
      return fail(error);
    } catch (error) {
      return fail(failureFromThrown(error));
    }
  }

  async function fetchPage(query: UnsplashSearchQuery, accessKey: string): Promise<UnsplashResult<UnsplashSearchPage>> {
    const called = await call(buildSearchUrl(query), SEARCH_TIMEOUT_MS, accessKey);
    if (!called.ok) return called;
    const parsed = RawSearchResponse.safeParse(await called.value.json().catch(() => null));
    if (!parsed.success) return fail({ code: "INVALID_RESPONSE", message: "Unsplash sent an unexpected answer." });
    const { photos, skipped } = normalizePhotos(parsed.data.results);
    const page: UnsplashSearchPage = {
      items: photos,
      page: query.page,
      perPage: query.perPage,
      total: parsed.data.total,
      totalPages: parsed.data.total_pages,
      skipped,
    };
    cache.set(cacheKeyFor(query), page, now());
    return { ok: true, value: page };
  }

  return {
    async search(rawQuery) {
      if (!options.accessKey) return fail(NOT_CONFIGURED);
      const query = UnsplashSearchQuery.parse(rawQuery);
      const key = cacheKeyFor(query);
      const cached = cache.get(key, now());
      if (cached) return { ok: true, value: cached };
      const blocked = cooldown.activeError(now());
      if (blocked) return fail(blocked);
      const accessKey = options.accessKey;
      return cache.shareInFlight(key, () => fetchPage(query, accessKey));
    },

    async trackDownload(photo) {
      if (!options.accessKey) return fail(NOT_CONFIGURED);
      const called = await call(new URL(photo.downloadLocation), DOWNLOAD_TIMEOUT_MS, options.accessKey);
      return called.ok ? { ok: true, value: true } : called;
    },
  };
}
