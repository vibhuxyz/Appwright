import { ELEMENT_SELECTION_LIMITS as LIMITS } from "@repo/contracts";

export const INSPECTOR_MESSAGE = {
  setEditMode: "aw:edit-mode",
  select: "aw:select",
  ready: "aw:ready",
} as const;

const OUTLINE_COLOR = "#6366f1";
const OUTLINE_WIDTH_PX = 2;
const MAX_PATH_DEPTH = 6;
const OVERLAY_Z_INDEX = 2147483647;

export const INSPECTOR_SCRIPT = `(function () {
  if (window.__awInspector) return;
  window.__awInspector = true;
  var enabled = false;
  var hovered = null;
  var overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = "position:fixed;pointer-events:none;display:none;z-index:${OVERLAY_Z_INDEX};outline:${OUTLINE_WIDTH_PX}px solid ${OUTLINE_COLOR};outline-offset:-${OUTLINE_WIDTH_PX}px;background:rgba(99,102,241,0.08);";
  function clip(value, max) { return String(value || "").replace(/\\s+/g, " ").trim().slice(0, max); }
  function segment(el) {
    var tag = el.tagName.toLowerCase();
    var parent = el.parentElement;
    if (!parent) return tag;
    var same = Array.prototype.filter.call(parent.children, function (c) { return c.tagName === el.tagName; });
    return same.length > 1 ? tag + ":nth-of-type(" + (same.indexOf(el) + 1) + ")" : tag;
  }
  function pathOf(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body && parts.length < ${MAX_PATH_DEPTH}) {
      parts.unshift(segment(el));
      el = el.parentElement;
    }
    return parts.join(" > ");
  }
  function draw(el) {
    var rect = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  }
  function clear() { hovered = null; overlay.style.display = "none"; }
  function describe(el) {
    return {
      route: clip(location.pathname, ${LIMITS.route}),
      tag: clip(el.tagName.toLowerCase(), ${LIMITS.tag}),
      text: clip(el.innerText || el.textContent, ${LIMITS.text}),
      classes: clip(el.getAttribute("class"), ${LIMITS.classes}),
      selector: clip(pathOf(el), ${LIMITS.selector}),
      html: clip(el.outerHTML, ${LIMITS.html})
    };
  }
  document.addEventListener("mousemove", function (event) {
    if (!enabled || event.target === hovered || event.target === document.documentElement) return;
    hovered = event.target;
    draw(hovered);
  }, true);
  document.addEventListener("click", function (event) {
    if (!enabled) return;
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage({ type: "${INSPECTOR_MESSAGE.select}", selection: describe(event.target) }, "*");
  }, true);
  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var data = event.data;
    if (!data || data.type !== "${INSPECTOR_MESSAGE.setEditMode}") return;
    enabled = data.enabled === true;
    document.documentElement.style.cursor = enabled ? "crosshair" : "";
    if (!enabled) clear();
  });
  document.documentElement.appendChild(overlay);
  window.parent.postMessage({ type: "${INSPECTOR_MESSAGE.ready}" }, "*");
})();`;
