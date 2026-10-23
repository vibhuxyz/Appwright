import { findFreePort } from "./find-free-port";

const READY_TIMEOUT_MS = 45_000;
const READY_POLL_MS = 250;
const PROBE_TIMEOUT_MS = 1_500;
const STOP_TIMEOUT_MS = 5_000;
const MAX_LOG_TAIL_CHARS = 1_500;
const START_COMMAND = ["bun", "run", "start"] as const;
const PASSTHROUGH_ENV = ["PATH", "HOME", "TMPDIR"] as const;

export interface AppServer {
  readonly baseUrl: string;
  stop(): Promise<void>;
}

export class AppServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppServerError";
  }
}

function minimalEnv(port: number): Record<string, string> {
  const inherited = PASSTHROUGH_ENV.flatMap((name) => {
    const value = process.env[name];
    return value === undefined ? [] : [[name, value] as const];
  });
  return {
    ...Object.fromEntries(inherited),
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
  };
}

function tailCollector(stream: ReadableStream<Uint8Array>): () => string {
  let text = "";
  const decoder = new TextDecoder();
  void stream
    .pipeTo(
      new WritableStream({
        write(chunk) {
          text = `${text}${decoder.decode(chunk)}`.slice(-MAX_LOG_TAIL_CHARS);
        },
      }),
    )
    .catch(() => undefined);
  return () => text.trim();
}

async function answers(baseUrl: string): Promise<boolean> {
  try {
    await fetch(baseUrl, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    return true;
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "TypeError")) return false;
    throw error;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilReady(
  child: Bun.Subprocess,
  baseUrl: string,
  logTail: () => string,
): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new AppServerError(`The app exited before it was ready (code ${child.exitCode}). ${logTail()}`);
    }
    if (await answers(baseUrl)) return;
    await delay(READY_POLL_MS);
  }
  throw new AppServerError(`The app did not answer on ${baseUrl} within ${READY_TIMEOUT_MS / 1000}s. ${logTail()}`);
}

export async function startAppServer(workspaceDir: string): Promise<AppServer> {
  const port = await findFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = Bun.spawn([...START_COMMAND], {
    cwd: workspaceDir,
    env: minimalEnv(port),
    stdout: "pipe",
    stderr: "pipe",
  });
  const logTail = tailCollector(child.stderr);
  void child.stdout.pipeTo(new WritableStream()).catch(() => undefined);
  const stop = async (): Promise<void> => {
    child.kill();
    await Promise.race([child.exited, delay(STOP_TIMEOUT_MS)]);
  };
  try {
    await waitUntilReady(child, baseUrl, logTail);
  } catch (error) {
    await stop();
    throw error;
  }
  return { baseUrl, stop };
}
