import { boundedMs, MAX_PAUSE_MS } from "../live";
import { MAX_SCROLL_STEPS } from "./constants";

export const SCROLL_STEP_SCRIPT = `(() => {
  const before = window.scrollY;
  const step = Math.max(window.innerHeight - 80, 200);
  window.scrollBy(0, step);
  return window.scrollY !== before;
})()`;

export const SCROLL_TOP_SCRIPT = "window.scrollTo(0, 0)";

export function scrollScript(pauseMs: number): string {
  const pause = boundedMs(pauseMs, MAX_PAUSE_MS);
  return `(async () => {
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const hold = () => new Promise((resolve) => setTimeout(resolve, ${pause}));
  const step = Math.max(window.innerHeight - 80, 200);
  for (let index = 0; index < ${MAX_SCROLL_STEPS}; index += 1) {
    const before = window.scrollY;
    window.scrollBy(0, step);
    await nextFrame();
    await hold();
    if (window.scrollY === before) break;
  }
  window.scrollTo(0, 0);
  await nextFrame();
  await hold();
})()`;
}
