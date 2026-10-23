import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createLogger } from "@repo/logger";

const FRAME_GAP_MS = 200;
const LIVE_FRAME_NAME = "live.jpg";
const log = createLogger("browser-live");

export interface FrameClock {
  now(): number;
  wait(ms: number): Promise<void>;
}

const realClock: FrameClock = {
  now: () => Date.now(),
  wait: (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }),
};

export interface LiveFrameWriter {
  push(jpeg: Buffer): void;
  idle(): Promise<void>;
}

export function createLiveFrameWriter(directory: string, clock: FrameClock = realClock): LiveFrameWriter {
  const target = join(directory, LIVE_FRAME_NAME);
  const temporary = join(directory, ".live.jpg.tmp");
  let latest: Buffer | null = null;
  let lastWriteAt = -FRAME_GAP_MS;
  let chain = Promise.resolve();

  async function writeIfDue(): Promise<void> {
    if (!latest) return;
    const waitMs = FRAME_GAP_MS - (clock.now() - lastWriteAt);
    if (waitMs > 0) await clock.wait(waitMs);
    const frame = latest;
    if (!frame) return;
    latest = null;
    await mkdir(directory, { recursive: true });
    await writeFile(temporary, frame);
    await rename(temporary, target);
    lastWriteAt = clock.now();
  }

  return {
    push(jpeg) {
      latest = jpeg;
      chain = chain.then(writeIfDue).catch((error: unknown) => {
        log.warn("browser live frame was not saved", {
          reason: error instanceof Error ? error.message : String(error),
        });
      });
    },
    idle: () => chain,
  };
}

export async function removeLiveFrame(directory: string): Promise<void> {
  await rm(join(directory, LIVE_FRAME_NAME), { force: true });
}
