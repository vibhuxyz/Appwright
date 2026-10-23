import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { createLiveFrameWriter, type FrameClock } from "../src/worker/browser-live";

function manualClock(): FrameClock & { time: number } {
  const clock = {
    time: 0,
    now() {
      return clock.time;
    },
    async wait(ms: number) {
      clock.time += ms;
    },
  };
  return clock;
}

describe("live frame writer", () => {
  test("keeps the newest frame and spaces writes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "browser-live-"));
    const clock = manualClock();
    const writer = createLiveFrameWriter(directory, clock);
    writer.push(Buffer.from("first"));
    writer.push(Buffer.from("second"));
    await writer.idle();
    expect(await readFile(join(directory, "live.jpg"), "utf8")).toBe("second");

    writer.push(Buffer.from("third"));
    await writer.idle();
    expect(clock.time).toBeGreaterThan(0);
    expect(await readFile(join(directory, "live.jpg"), "utf8")).toBe("third");
  });
});
