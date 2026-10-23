export const UNSPLASH_SEARCH_ENDPOINT = "https://api.unsplash.com/search/photos";
export const UNSPLASH_API_VERSION = "v1";
export const UNSPLASH_REFERRAL = { source: "appwright", medium: "referral" } as const;

export const SEARCH_TIMEOUT_MS = 8_000;
export const DOWNLOAD_TIMEOUT_MS = 5_000;
export const CACHE_TTL_MS = 10 * 60_000;
export const CACHE_MAX_ENTRIES = 200;
export const RATE_LIMIT_COOLDOWN_MS = 5 * 60_000;
export const MAX_DESCRIPTION_CHARS = 500;
