import { describe, expect, test } from "bun:test";
import { launchPlaywrightSession } from "../src/session";

const JPEG_START = [0xff, 0xd8] as const;
const FRAME_WAIT_MS = 3_000;

async function waitForFrame(frames: readonly Buffer[]): Promise<void> {
  const started = Date.now();
  while (frames.length === 0 && Date.now() - started < FRAME_WAIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

describe("playwright live frames", () => {
  test("sends jpeg frames from the check browser", async () => {
    const frames: Buffer[] = [];
    const session = await launchPlaywrightSession({ onFrame: (jpeg) => frames.push(jpeg) });
    const page = await session.openPage({ name: "desktop", width: 800, height: 600 });
    try {
      await page.navigate("data:text/html,<button>Plan a visit</button>");
      await waitForFrame(frames);
    } finally {
      await page.close();
      await session.close();
    }
    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0]?.[0]).toBe(JPEG_START[0]);
    expect(frames[0]?.[1]).toBe(JPEG_START[1]);
  }, 20_000);
});
