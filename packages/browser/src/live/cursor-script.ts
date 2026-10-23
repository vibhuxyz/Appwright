import { boundedMs } from "./bounded-ms";
import { MAX_PAUSE_MS } from "./constants";

export const HIDE_CURSOR_SCRIPT = `document.documentElement?.setAttribute("data-aw-hide-cursor","")`;
export const SHOW_CURSOR_SCRIPT = `document.documentElement?.removeAttribute("data-aw-hide-cursor")`;

const CURSOR_SOURCE = `(() => {
  const css = "position:fixed;pointer-events:none;";
  function ensure() {
    const root = document.documentElement;
    if (!root || document.getElementById("aw-check-cursor")) return;
    const style = document.createElement("style");
    style.textContent = "html[data-aw-hide-cursor] #aw-check-cursor,html[data-aw-hide-cursor] #aw-check-ring{display:none !important}";
    const cursor = document.createElement("div");
    cursor.id = "aw-check-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.style.cssText = css + "z-index:2147483647;width:16px;height:16px;margin:-2px 0 0 -2px;border:2px solid #111;border-radius:999px;background:#c8f542;transform:translate(-100px,-100px)";
    const ring = document.createElement("div");
    ring.id = "aw-check-ring";
    ring.setAttribute("aria-hidden", "true");
    ring.style.cssText = css + "z-index:2147483646;width:36px;height:36px;margin:-18px 0 0 -18px;border:2px solid #c8f542;border-radius:999px;opacity:0;transform:translate(-100px,-100px)";
    root.append(style, cursor, ring);
  }
  function move(x, y) {
    ensure();
    const cursor = document.getElementById("aw-check-cursor");
    if (cursor) cursor.style.transform = "translate(" + x + "px, " + y + "px)";
  }
  function press(x, y) {
    move(x, y);
    const ring = document.getElementById("aw-check-ring");
    if (!ring) return;
    ring.style.transition = "none";
    ring.style.opacity = "1";
    ring.style.transform = "translate(" + x + "px, " + y + "px) scale(0.4)";
    requestAnimationFrame(() => {
      ring.style.transition = "transform __HOLD__ms ease, opacity __HOLD__ms ease";
      ring.style.opacity = "0";
      ring.style.transform = "translate(" + x + "px, " + y + "px) scale(1.4)";
    });
  }
  document.addEventListener("mousemove", (event) => move(event.clientX, event.clientY), true);
  document.addEventListener("mousedown", (event) => press(event.clientX, event.clientY), true);
  document.addEventListener("DOMContentLoaded", ensure);
  ensure();
})()`;

export function cursorScript(holdMs: number): string {
  return CURSOR_SOURCE.replaceAll("__HOLD__", String(boundedMs(holdMs, MAX_PAUSE_MS)));
}
