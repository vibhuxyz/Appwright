export const API_VERSION_PREFIX = "/v1";
export const EXEC_ROUTE = "/v1/exec";
export const FILE_READ_ROUTE = "/v1/files/read";
export const FILE_WRITE_ROUTE = "/v1/files/write";
export const GIT_CLONE_ROUTE = "/v1/git/clone";
export const GIT_COMMIT_ROUTE = "/v1/git/commit";
export const GIT_PUSH_ROUTE = "/v1/git/push";
export const EVENTS_ROUTE = "/v1/events";
export const HEALTH_ROUTE = "/v1/health";
export const BROWSER_ROUTE_PREFIX = "/v1/browser";

export const MAX_FILE_READ_BYTES = 5 * 1024 * 1024;
export const DEFAULT_EXEC_TIMEOUT_MS = 60_000;
export const DEFAULT_LEASE_DURATION_MS = 300_000;
