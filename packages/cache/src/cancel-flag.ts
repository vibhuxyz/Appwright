// POST /conversation/:sessionId/stop (apps/api) sets this; the sandboxed
// worker (apps/agent) polls it between loop iterations since an HTTP
// request in one process can't reach into another process's
// AbortController directly. TTL keeps a flag from outliving the run that
// should have consumed it.
export const CANCEL_FLAG_TTL_SECONDS = 600;

export function cancelFlagKey(sessionId: string): string {
  return `agent:cancel:${sessionId}`;
}
