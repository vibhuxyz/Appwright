export interface PreviewViewInput {
  sessionUrl: string | null;
  projectUrl: string | null;
  hasSession: boolean;
  working: boolean;
  pending: boolean;
  failed: boolean;
  reloadKey: number;
  loadedKey: string | null;
  failedKey: string | null;
}

export interface PreviewView {
  url: string | null;
  isStarting: boolean;
  isError: boolean;
  isRunning: boolean;
  currentKey: string;
  isLoading: boolean;
  loadStuck: boolean;
}

export function previewView(input: PreviewViewInput): PreviewView {
  const url = input.hasSession ? input.sessionUrl : input.projectUrl;
  const isStarting = input.working && input.pending && !url;
  const isError = input.working && input.failed && !url;
  const currentKey = `${url ?? ""}:${input.reloadKey}`;
  return {
    url,
    isStarting,
    isError,
    isRunning: url !== null,
    currentKey,
    isLoading: url !== null ? input.loadedKey !== currentKey : isStarting,
    loadStuck: url !== null ? input.failedKey === currentKey : false,
  };
}

export function previewErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not start the session preview server.";
}

export function badgeTextFor(state: {
  checking: boolean;
  running: boolean;
  failed: boolean;
  starting: boolean;
}): string {
  if (state.checking) return "Checking";
  if (state.running) return "Running";
  if (state.failed) return "Error";
  if (state.starting) return "Waking up…";
  return "Sleeping";
}
