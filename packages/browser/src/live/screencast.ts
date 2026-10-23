import type { CDPSession, Page } from "playwright-core";
import { SCREENCAST_MAX_HEIGHT, SCREENCAST_MAX_WIDTH, SCREENCAST_QUALITY } from "./constants";

function isClosedSession(error: unknown): boolean {
  return error instanceof Error && /closed|detached/i.test(error.message);
}

function isJpegFrame(value: { data?: unknown; sessionId?: unknown }): value is { data: string; sessionId: number } {
  return typeof value.data === "string" && typeof value.sessionId === "number";
}

export async function startPageScreencast(
  page: Page,
  onFrame: (jpeg: Buffer) => void,
): Promise<() => Promise<void>> {
  const client = await page.context().newCDPSession(page);
  let stopped = false;
  client.on("Page.screencastFrame", (event) => {
    if (stopped || !isJpegFrame(event)) return;
    onFrame(Buffer.from(event.data, "base64"));
    void client.send("Page.screencastFrameAck", { sessionId: event.sessionId }).then(undefined, (error: unknown) => {
      if (!isClosedSession(error)) stopped = true;
    });
  });
  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: SCREENCAST_QUALITY,
    maxWidth: SCREENCAST_MAX_WIDTH,
    maxHeight: SCREENCAST_MAX_HEIGHT,
    everyNthFrame: 1,
  });
  return () => stopScreencast(client, () => {
    stopped = true;
  });
}

async function stopScreencast(client: CDPSession, markStopped: () => void): Promise<void> {
  markStopped();
  try {
    await client.send("Page.stopScreencast");
  } catch (error) {
    if (!isClosedSession(error)) throw error;
  }
  try {
    await client.detach();
  } catch (error) {
    if (!isClosedSession(error)) throw error;
  }
}
