import { sniffImageMime } from "./sniff-image-mime";

const GOOGLE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const WIKIMEDIA_ENDPOINT = "https://commons.wikimedia.org/w/api.php";
const SEARCH_TIMEOUT_MS = 12_000;
const DOWNLOAD_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_CANDIDATES = 5;
const USER_AGENT = "Appwright/1.0 (section image search)";

export interface StockImage {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
}

export type StockSearchErrorCode = "NOT_FOUND" | "TIMEOUT" | "PROVIDER_ERROR";

export interface StockSearchError {
  readonly code: StockSearchErrorCode;
  readonly message: string;
}

export type StockSearchResult =
  | { readonly ok: true; readonly value: StockImage }
  | { readonly ok: false; readonly error: StockSearchError };

export type StockFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface SearchStockImageInput {
  readonly query: string;
  readonly signal?: AbortSignal;
  readonly fetchImpl?: StockFetch;
}

function timeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

function withTimeout(parent: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  if (!parent) return timeout;
  if (typeof AbortSignal.any === "function") return AbortSignal.any([parent, timeout]);
  return timeout;
}

async function readJson(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

function googleLinks(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("items" in payload)) return [];
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (item && typeof item === "object" && "link" in item ? String((item as { link: unknown }).link) : ""))
    .filter((link) => link.startsWith("https://"))
    .slice(0, MAX_CANDIDATES);
}

function wikimediaLinks(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("query" in payload)) return [];
  const query = (payload as { query?: { pages?: Record<string, { imageinfo?: { url?: string }[] }> } }).query;
  const pages = query?.pages ?? {};
  return Object.values(pages)
    .map((page) => page.imageinfo?.[0]?.url ?? "")
    .filter((url) => url.startsWith("https://"))
    .slice(0, MAX_CANDIDATES);
}

async function downloadImage(
  url: string,
  fetchImpl: StockFetch,
  signal: AbortSignal,
): Promise<StockImage | null> {
  const response = await fetchImpl(url, {
    signal: withTimeout(signal, DOWNLOAD_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
    redirect: "follow",
  });
  if (!response.ok) return null;
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;
  const mime = sniffImageMime(buffer);
  if (!mime) return null;
  return { bytes: buffer, mimeType: mime };
}

async function googleCandidates(
  query: string,
  fetchImpl: StockFetch,
  signal: AbortSignal,
): Promise<string[]> {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return [];
  const url = new URL(GOOGLE_ENDPOINT);
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("imgType", "photo");
  url.searchParams.set("safe", "active");
  url.searchParams.set("num", String(MAX_CANDIDATES));
  const response = await fetchImpl(url, {
    signal: withTimeout(signal, SEARCH_TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return [];
  return googleLinks(await readJson(response));
}

async function wikimediaCandidates(
  query: string,
  fetchImpl: StockFetch,
  signal: AbortSignal,
): Promise<string[]> {
  const url = new URL(WIKIMEDIA_ENDPOINT);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", query);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", String(MAX_CANDIDATES));
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("iiurlwidth", "1600");
  const response = await fetchImpl(url, {
    signal: withTimeout(signal, SEARCH_TIMEOUT_MS),
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
  });
  if (!response.ok) return [];
  return wikimediaLinks(await readJson(response));
}

export async function searchStockImage(input: SearchStockImageInput): Promise<StockSearchResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const query = input.query.replace(/\s+/g, " ").trim().slice(0, 200);
  if (!query) {
    return { ok: false, error: { code: "NOT_FOUND", message: "No search query for this section" } };
  }
  try {
    const google = await googleCandidates(query, fetchImpl, withTimeout(input.signal, SEARCH_TIMEOUT_MS));
    const wiki =
      google.length > 0 ? [] : await wikimediaCandidates(query, fetchImpl, withTimeout(input.signal, SEARCH_TIMEOUT_MS));
    const links = google.length > 0 ? google : wiki;
    for (const link of links) {
      const image = await downloadImage(link, fetchImpl, withTimeout(input.signal, DOWNLOAD_TIMEOUT_MS));
      if (image) return { ok: true, value: image };
    }
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "No matching photo for this section" },
    };
  } catch (error) {
    if (timeoutError(error) || input.signal?.aborted) {
      return { ok: false, error: { code: "TIMEOUT", message: "Timed out looking up a photo" } };
    }
    return {
      ok: false,
      error: {
        code: "PROVIDER_ERROR",
        message: error instanceof Error ? error.message : "Could not look up a photo",
      },
    };
  }
}
