import type { Page } from "playwright-core";
import {
  ABORTED_REQUEST_ERROR,
  IGNORED_RESPONSE_PATHS,
  MAX_OBSERVED_EVENTS,
  RESOURCE_FAILURE_PREFIX,
} from "./constants";
import type { BadResponse, ObservedEvents } from "./types";

const HTTP_ERROR_STATUS = 400;

function pushCapped<T>(list: T[], item: T): void {
  if (list.length < MAX_OBSERVED_EVENTS) list.push(item);
}

function isIgnoredPath(url: string): boolean {
  return IGNORED_RESPONSE_PATHS.some((path) => new URL(url).pathname === path);
}

export function collectEvents(page: Page): () => ObservedEvents {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: BadResponse[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.startsWith(RESOURCE_FAILURE_PREFIX)) return;
    pushCapped(consoleErrors, text);
  });
  page.on("pageerror", (error) => pushCapped(pageErrors, error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "request failed";
    if (failure === ABORTED_REQUEST_ERROR) return;
    pushCapped(failedRequests, `${request.url()} (${failure})`);
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status < HTTP_ERROR_STATUS || isIgnoredPath(response.url())) return;
    pushCapped(badResponses, { url: response.url(), status });
  });

  return () => {
    const drained: ObservedEvents = {
      consoleErrors: [...consoleErrors],
      pageErrors: [...pageErrors],
      failedRequests: [...failedRequests],
      badResponses: [...badResponses],
    };
    consoleErrors.length = 0;
    pageErrors.length = 0;
    failedRequests.length = 0;
    badResponses.length = 0;
    return drained;
  };
}
