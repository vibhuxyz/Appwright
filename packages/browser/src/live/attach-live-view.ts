import type { Page } from "playwright-core";
import { cursorScript } from "./cursor-script";
import { WATCH_HOLD_MS } from "./constants";
import { startPageScreencast } from "./screencast";

export type AttachLiveResult =
  | { readonly ok: true; readonly holdMs: number; readonly stop: () => Promise<void> }
  | { readonly ok: false; readonly reason: string };

export async function attachLiveView(
  page: Page,
  onFrame: (jpeg: Buffer) => void,
): Promise<AttachLiveResult> {
  try {
    await page.addInitScript(cursorScript(WATCH_HOLD_MS));
    const stop = await startPageScreencast(page, onFrame);
    return { ok: true, holdMs: WATCH_HOLD_MS, stop };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
