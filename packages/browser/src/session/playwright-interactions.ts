import type { Page } from "playwright-core";
import { ACTION_TIMEOUT_MS, NETWORK_IDLE_TIMEOUT_MS } from "./constants";
import type {
  ActionResult,
  ClickTarget,
  FieldDescriptor,
  FormDescriptor,
  InteractionOutcome,
} from "./interaction-types";
import {
  CAPTURE_STATE_SCRIPT,
  LIST_CLICK_TARGETS_SCRIPT,
  LIST_FORMS_SCRIPT,
  invalidFieldsScript,
} from "./interaction-scripts";
import {
  parseClickTargets,
  parseForms,
  parseInvalidFields,
  parsePageState,
  type PageState,
} from "./parse-interactions";
import { trackRequests } from "./track-requests";

const NEXT_FRAME_SCRIPT = "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))";
const SUBMIT_SELECTOR = 'button[type="submit"], input[type="submit"], button:not([type])';
const MAX_NEW_TEXT_LINES = 5;
const POINTER_HOVER_MS = 1_000;
const CHECKABLE_KINDS = new Set(["checkbox", "radio"]);

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

async function attempt<T>(action: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await action() };
  } catch (error) {
    if (!isTimeoutError(error)) throw error;
    const reason = error instanceof Error ? (error.message.split("\n")[0] ?? "timed out") : "timed out";
    return { ok: false, reason };
  }
}

async function settle(page: Page): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT_MS });
  } catch (error) {
    if (!isTimeoutError(error)) throw error;
  }
  await page.evaluate(NEXT_FRAME_SCRIPT);
}

async function captureState(page: Page): Promise<PageState> {
  return parsePageState(await page.evaluate(CAPTURE_STATE_SCRIPT));
}

async function observeAround(
  page: Page,
  action: () => Promise<void>,
  invalidScope: number | null,
): Promise<InteractionOutcome> {
  const urlBefore = page.url();
  const before = await captureState(page);
  const stopTracking = trackRequests(page);
  await action();
  await settle(page);
  const requests = stopTracking();
  const after = await captureState(page);
  const known = new Set(before.lines);
  const invalid =
    invalidScope === null ? [] : parseInvalidFields(await page.evaluate(invalidFieldsScript(invalidScope)));
  return {
    urlChanged: page.url() !== urlBefore,
    newText: after.lines.filter((line) => !known.has(line) && line.length > 2).slice(0, MAX_NEW_TEXT_LINES),
    invalidFields: invalid,
    dialogShown: after.dialog && !before.dialog,
    requests,
  };
}

export async function listForms(page: Page): Promise<FormDescriptor[]> {
  return parseForms(await page.evaluate(LIST_FORMS_SCRIPT));
}

export async function pointAtField(page: Page, formIndex: number, fieldIndex: number): Promise<void> {
  const locator = page.locator(`[data-aw-form="${formIndex}"] [data-aw-field="${fieldIndex}"]`).first();
  try {
    await locator.hover({ timeout: POINTER_HOVER_MS });
  } catch (error) {
    if (!isTimeoutError(error)) throw error;
  }
}

export async function listClickTargets(page: Page): Promise<ClickTarget[]> {
  return parseClickTargets(await page.evaluate(LIST_CLICK_TARGETS_SCRIPT));
}

export function fillField(
  page: Page,
  formIndex: number,
  field: FieldDescriptor,
  value: string,
): Promise<ActionResult<void>> {
  const locator = page.locator(`[data-aw-form="${formIndex}"] [data-aw-field="${field.index}"]`).first();
  return attempt(async () => {
    if (CHECKABLE_KINDS.has(field.kind)) {
      await locator.check({ timeout: ACTION_TIMEOUT_MS });
    } else if (field.kind === "select") {
      const optionCount = await locator.locator("option").count();
      await locator.selectOption({ index: optionCount > 1 ? 1 : 0 }, { timeout: ACTION_TIMEOUT_MS });
    } else {
      await locator.fill(value, { timeout: ACTION_TIMEOUT_MS });
    }
  });
}

export function submitForm(page: Page, formIndex: number): Promise<ActionResult<InteractionOutcome>> {
  const submit = page.locator(`[data-aw-form="${formIndex}"]`).locator(SUBMIT_SELECTOR).first();
  return attempt(() =>
    observeAround(page, () => submit.click({ timeout: ACTION_TIMEOUT_MS }), formIndex),
  );
}

export function clickTarget(page: Page, index: number): Promise<ActionResult<InteractionOutcome>> {
  const target = page.locator(`[data-aw-click="${index}"]`).first();
  return attempt(() =>
    observeAround(page, () => target.click({ timeout: ACTION_TIMEOUT_MS }), null).then(async (outcome) => {
      if (outcome.dialogShown) await page.keyboard.press("Escape");
      return outcome;
    }),
  );
}
