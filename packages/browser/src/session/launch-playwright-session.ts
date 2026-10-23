import { chromium, type Browser } from "playwright-core";
import { attachLiveView, type LiveViewOptions } from "../live";
import { PlaywrightPage } from "./playwright-page";
import { BrowserUnavailableError, type BrowserSession } from "./types";

const INSTALL_HINT = "Run `bun run --cwd packages/browser install-browser` to download Chromium.";

async function launchChromium(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0] : String(error);
    throw new BrowserUnavailableError(`Cannot launch Chromium: ${reason}. ${INSTALL_HINT}`);
  }
}

export async function launchPlaywrightSession(live?: LiveViewOptions): Promise<BrowserSession> {
  const browser = await launchChromium();
  return {
    async openPage(viewport) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const page = await context.newPage();
      const wrapped = new PlaywrightPage(page);
      if (!live) return wrapped;
      const attached = await attachLiveView(page, live.onFrame);
      if (attached.ok) wrapped.armWatch(attached.holdMs, attached.stop, live.onFrame);
      else live.onError?.(attached.reason);
      return wrapped;
    },
    close: () => browser.close(),
  };
}
