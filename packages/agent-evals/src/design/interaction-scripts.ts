import type { Page } from "playwright-core";
import type { InteractionResult } from "./interaction-types";

const DRAG_DISTANCE_PX = { x: 140, y: 60 } as const;
const MIN_MOVED_PX = 40;
const SETTLE_MS = 400;
const CANVAS_GAP_MS = 500;
const MIN_TAP_TARGET_PX = 24;
const MAX_LISTED = 5;

function result(id: InteractionResult["id"], passed: boolean, detail: string): InteractionResult {
  return { id, passed, detail };
}

export async function checkDragCard(page: Page): Promise<InteractionResult> {
  const card = page.getByTestId("draggable-card").first();
  const before = await card.boundingBox();
  if (!before) return result("drag-card", false, "No visible draggable card");
  const startX = before.x + before.width / 2;
  const startY = before.y + before.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + DRAG_DISTANCE_PX.x, startY + DRAG_DISTANCE_PX.y, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(SETTLE_MS);
  const afterDrag = await card.boundingBox();
  const dragged = afterDrag ? Math.hypot(afterDrag.x - before.x, afterDrag.y - before.y) : 0;
  const second = page.getByTestId("draggable-card").nth(1);
  const keyBefore = await second.boundingBox();
  await second.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(SETTLE_MS);
  const keyAfter = await second.boundingBox();
  const keyed = keyBefore && keyAfter ? keyAfter.x - keyBefore.x : 0;
  return result("drag-card", dragged >= MIN_MOVED_PX && keyed > 0, `pointer drag moved ${Math.round(dragged)}px, arrow keys moved ${Math.round(keyed)}px`);
}

export async function checkImageCompareKeyboard(page: Page): Promise<InteractionResult> {
  const slider = page.getByTestId("image-compare").locator('input[type="range"]');
  if ((await slider.count()) === 0) return result("image-compare-keyboard", false, "No compare slider");
  const before = Number(await slider.inputValue());
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  const after = Number(await slider.inputValue());
  return result("image-compare-keyboard", after < before, `slider ${before} → ${after} after two ArrowLeft presses`);
}

const OVERLAPPING_COMPARE_TEXT_SCRIPT = `(() => {
  const boxes = [...document.querySelectorAll('[data-testid="image-compare"] span')]
    .filter((element) => (element.textContent || "").trim().length > 0)
    .map((element) => ({ text: (element.textContent || "").trim().slice(0, 30), box: element.getBoundingClientRect() }))
    .filter((entry) => entry.box.width > 0 && entry.box.height > 0);
  const overlaps = [];
  boxes.forEach((first, index) => {
    for (const second of boxes.slice(index + 1)) {
      const isOverlapping = first.box.left < second.box.right && second.box.left < first.box.right && first.box.top < second.box.bottom && second.box.top < first.box.bottom;
      if (isOverlapping) overlaps.push(first.text + " / " + second.text);
    }
  });
  return overlaps;
})()`;

export async function checkImageCompareLabels(page: Page): Promise<InteractionResult> {
  if ((await page.getByTestId("image-compare").count()) === 0) return result("image-compare-labels", false, "No compare slider");
  const overlaps = await stringList(page, OVERLAPPING_COMPARE_TEXT_SCRIPT);
  return result("image-compare-labels", overlaps.length === 0, overlaps.length === 0 ? "compare labels do not overlap" : `overlapping: ${overlaps.slice(0, MAX_LISTED).join("; ")}`);
}

const CANVAS_FRAME_SCRIPT =`(() => { const canvas = document.querySelector('[data-testid="particle-field"]'); return canvas instanceof HTMLCanvasElement ? canvas.toDataURL() : ""; })()`;
const SCROLL_THROUGH_SCRIPT = `(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += window.innerHeight / 2) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  return true;
})()`;
const HIDDEN_HEADINGS_SCRIPT = `[...document.querySelectorAll("h1, h2, h3")]
  .filter((element) => element.getBoundingClientRect().height > 0)
  .filter((element) => {
    for (let node = element; node; node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) < 0.5) return true;
    }
    return false;
  })
  .map((element) => (element.textContent || "").trim().slice(0, 40))`;

function smallTargetsScript(minPx: number): string {
  return `[...document.querySelectorAll("a[href], button, input, summary")]
  .filter((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const isShown = box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    const isInline = style.display === "inline" && element.closest("p, li, dd, figcaption") !== null;
    return isShown && !isInline && (box.height < ${minPx} || box.width < ${minPx});
  })
  .map((element) => element.tagName.toLowerCase() + ' "' + (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 30) + '"')`;
}

async function canvasFrame(page: Page): Promise<string> {
  return String(await page.evaluate(CANVAS_FRAME_SCRIPT));
}

async function stringList(page: Page, script: string): Promise<string[]> {
  const value: unknown = await page.evaluate(script);
  return Array.isArray(value) ? value.map(String) : [];
}

export async function checkCanvasMotion(page: Page, isReduced: boolean): Promise<InteractionResult> {
  if ((await page.getByTestId("particle-field").count()) === 0) return result("canvas-reduced-motion", false, "No particle canvas");
  await page.waitForTimeout(SETTLE_MS);
  const first = await canvasFrame(page);
  await page.waitForTimeout(CANVAS_GAP_MS);
  const second = await canvasFrame(page);
  const isMoving = first !== second;
  const passed = isReduced ? !isMoving && first.length > 0 : isMoving;
  return result("canvas-reduced-motion", passed, `${isReduced ? "reduced motion" : "motion allowed"}: canvas ${isMoving ? "changed" : "stayed still"}`);
}

export async function checkContentAfterScroll(page: Page): Promise<InteractionResult> {
  await page.evaluate(SCROLL_THROUGH_SCRIPT);
  await page.waitForTimeout(SETTLE_MS * 2);
  const hidden = await stringList(page, HIDDEN_HEADINGS_SCRIPT);
  return result("content-after-scroll", hidden.length === 0, hidden.length === 0 ? "every heading visible after scrolling" : `still hidden: ${hidden.slice(0, MAX_LISTED).join("; ")}`);
}

export async function checkTapTargets(page: Page): Promise<InteractionResult> {
  const small = await stringList(page, smallTargetsScript(MIN_TAP_TARGET_PX));
  return result("mobile-tap-targets", small.length === 0, small.length === 0 ? `every control at least ${MIN_TAP_TARGET_PX}px` : `under ${MIN_TAP_TARGET_PX}px: ${small.slice(0, MAX_LISTED).join("; ")}${small.length > MAX_LISTED ? ` (+${small.length - MAX_LISTED} more)` : ""}`);
}
