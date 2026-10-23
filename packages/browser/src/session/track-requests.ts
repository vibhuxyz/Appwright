import type { Page, Request } from "playwright-core";
import type { RequestRecord } from "./interaction-types";

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DATA_RESOURCE_TYPES = new Set(["xhr", "fetch"]);
const MAX_TRACKED_REQUESTS = 30;

function isInteresting(request: Request): boolean {
  return !READ_ONLY_METHODS.has(request.method()) || DATA_RESOURCE_TYPES.has(request.resourceType());
}

export function trackRequests(page: Page): () => RequestRecord[] {
  const tracked = new Map<Request, number | null>();
  const onRequest = (request: Request): void => {
    if (isInteresting(request) && tracked.size < MAX_TRACKED_REQUESTS) tracked.set(request, null);
  };
  const onResponse = (response: { request(): Request; status(): number }): void => {
    const request = response.request();
    if (tracked.has(request)) tracked.set(request, response.status());
  };
  page.on("request", onRequest);
  page.on("response", onResponse);
  return () => {
    page.off("request", onRequest);
    page.off("response", onResponse);
    return [...tracked].map(([request, status]) => ({
      method: request.method(),
      path: new URL(request.url()).pathname,
      status,
    }));
  };
}
