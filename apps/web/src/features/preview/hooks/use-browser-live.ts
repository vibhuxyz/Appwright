import { useEffect, useState } from "react";
import { httpClient } from "@/shared/lib/httpClient";

const FRAME_POLL_MS = 250;

interface LivePoll {
  cancelled: boolean;
  current: string | null;
  inFlight: boolean;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function loadFrame(
  sessionId: string,
  signal: AbortSignal,
  poll: LivePoll,
  setSrc: (src: string) => void,
  setError: (error: string | null) => void,
): Promise<void> {
  if (poll.inFlight || poll.cancelled) return;
  poll.inFlight = true;
  try {
    const blob = await httpClient.getBlob(
      `/v1/sessions/${encodeURIComponent(sessionId)}/browser-live`,
      signal,
    );
    if (poll.cancelled || !blob || blob.size === 0) return;
    const next = URL.createObjectURL(blob);
    if (poll.current) URL.revokeObjectURL(poll.current);
    poll.current = next;
    setSrc(next);
    setError(null);
  } catch (error) {
    if (isAbortError(error) || poll.cancelled || poll.current) return;
    setError(error instanceof Error ? error.message : "Live view failed");
  } finally {
    poll.inFlight = false;
  }
}

export function useBrowserLive(sessionId: string): { src: string | null; error: string | null } {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const poll: LivePoll = { cancelled: false, current: null, inFlight: false };
    const controller = new AbortController();
    const load = () => loadFrame(sessionId, controller.signal, poll, setSrc, setError);
    void load();
    const timer = setInterval(() => {
      void load();
    }, FRAME_POLL_MS);
    return () => {
      poll.cancelled = true;
      controller.abort();
      clearInterval(timer);
      if (poll.current) URL.revokeObjectURL(poll.current);
    };
  }, [sessionId]);

  return { src, error };
}
