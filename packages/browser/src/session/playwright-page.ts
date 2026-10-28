import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { Page } from "playwright-core";
import { HIDE_CURSOR_SCRIPT, SCREENCAST_QUALITY, SHOW_CURSOR_SCRIPT, WATCH_SCROLL_PAUSE_MS } from "../live";
import { truncateSnapshot } from "../snapshot";
import { collectEvents } from "./collect-events";
import { MAX_SCROLL_STEPS, NAVIGATION_TIMEOUT_MS, NETWORK_IDLE_TIMEOUT_MS } from "./constants";
import type {
  ActionResult,
  ClickTarget,
  FieldDescriptor,
  FormDescriptor,
  InteractionOutcome,
} from "./interaction-types";
import { MEASURE_SCRIPT } from "./measure-script";
import { clickTarget, fillField, listClickTargets, listForms, pointAtField, submitForm } from "./playwright-interactions";
import { parseMeasurements } from "./parse-measurements";
import { SCROLL_STEP_SCRIPT, SCROLL_TOP_SCRIPT, scrollScript } from "./scroll-script";
import type { BrowserPage, NavigationResult, ObservedEvents, PageMeasurements } from "./types";

const NETWORK_ERROR_MARKER = "net::ERR_";
const FONTS_READY_SCRIPT = "document.fonts.ready.then(() => true)";

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

function isNetworkError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(NETWORK_ERROR_MARKER);
}

function isClosedPage(error: unknown): boolean {
  return error instanceof Error && /closed|detached/i.test(error.message);
}

export class PlaywrightPage implements BrowserPage {
  private readonly drain: () => ObservedEvents;
  private watchPauseMs = 0;
  private stopWatch: (() => Promise<void>) | null = null;
  private onFrame: ((jpeg: Buffer) => void) | null = null;

  constructor(private readonly page: Page) {
    this.drain = collectEvents(page);
  }

  armWatch(holdMs: number, stop: () => Promise<void>, onFrame: (jpeg: Buffer) => void): void {
    this.watchPauseMs = holdMs;
    this.stopWatch = stop;
    this.onFrame = onFrame;
  }

  async navigate(url: string): Promise<NavigationResult> {
    try {
      const response = await this.page.goto(url, { waitUntil: "load", timeout: NAVIGATION_TIMEOUT_MS });
      await this.settle();
      await this.publishFrame();
      await this.holdFrame();
      return { status: response?.status() ?? null };
    } catch (error) {
      if (!isTimeoutError(error) && !isNetworkError(error)) throw error;
      return { status: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async scrollThrough(): Promise<void> {
    if (this.watchPauseMs > 0) {
      await this.playScroll();
      return;
    }
    await this.page.evaluate(scrollScript(0));
    await this.settle();
  }

  async measure(): Promise<PageMeasurements> {
    return parseMeasurements(await this.page.evaluate(MEASURE_SCRIPT));
  }

  async snapshot(): Promise<string> {
    return truncateSnapshot(await this.page.locator("body").ariaSnapshot());
  }

  async screenshot(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    if (this.stopWatch) await this.page.evaluate(HIDE_CURSOR_SCRIPT);
    await this.page.evaluate(FONTS_READY_SCRIPT);
    try {
      await this.page.screenshot({ path: filePath, fullPage: true, animations: "disabled" });
    } finally {
      if (this.stopWatch) await this.page.evaluate(SHOW_CURSOR_SCRIPT);
    }
  }

  drainEvents(): ObservedEvents {
    return this.drain();
  }

  listForms(): Promise<FormDescriptor[]> {
    return listForms(this.page);
  }

  listClickTargets(): Promise<ClickTarget[]> {
    return listClickTargets(this.page);
  }

  async fillField(formIndex: number, field: FieldDescriptor, value: string): Promise<ActionResult<void>> {
    if (this.watchPauseMs > 0) await pointAtField(this.page, formIndex, field.index);
    const result = await fillField(this.page, formIndex, field, value);
    await this.finishWatchAction();
    return result;
  }

  async submitForm(formIndex: number): Promise<ActionResult<InteractionOutcome>> {
    const result = await submitForm(this.page, formIndex);
    await this.finishWatchAction();
    return result;
  }

  async clickTarget(index: number): Promise<ActionResult<InteractionOutcome>> {
    const result = await clickTarget(this.page, index);
    await this.finishWatchAction();
    return result;
  }

  async close(): Promise<void> {
    await this.stopWatch?.();
    this.stopWatch = null;
    await this.page.context().close();
  }

  private async playScroll(): Promise<void> {
    await this.publishFrame();
    for (let index = 0; index < MAX_SCROLL_STEPS; index += 1) {
      const moved = await this.page.evaluate(SCROLL_STEP_SCRIPT);
      await this.publishFrame();
      await this.pause(WATCH_SCROLL_PAUSE_MS);
      if (moved !== true) break;
    }
    await this.page.evaluate(SCROLL_TOP_SCRIPT);
    await this.publishFrame();
    await this.pause(WATCH_SCROLL_PAUSE_MS);
  }

  private async finishWatchAction(): Promise<void> {
    await this.publishFrame();
    await this.holdFrame();
  }

  private async publishFrame(): Promise<void> {
    if (!this.onFrame) return;
    try {
      const jpeg = await this.page.screenshot({
        type: "jpeg",
        quality: SCREENCAST_QUALITY,
        animations: "disabled",
      });
      this.onFrame(jpeg);
    } catch (error) {
      if (!isClosedPage(error)) throw error;
    }
  }

  private async holdFrame(): Promise<void> {
    await this.pause(this.watchPauseMs);
  }

  private async pause(ms: number): Promise<void> {
    if (ms === 0) return;
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private async settle(): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS });
    } catch (error) {
      if (!isTimeoutError(error)) throw error;
    }
  }
}
