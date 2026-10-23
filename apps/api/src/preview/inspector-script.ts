import {
  ELEMENT_SELECTION_LIMITS as LIMITS,
  INSPECTOR_ACCENT_COLOR,
  INSPECTOR_CURSOR_BASE64,
} from "@repo/contracts";

export const INSPECTOR_MESSAGE = {
  setEditMode: "aw:edit-mode",
  select: "aw:select",
  ready: "aw:ready",
} as const;

const OUTLINE_COLOR = INSPECTOR_ACCENT_COLOR;
const OUTLINE_WIDTH_PX = 2;
const MAX_PATH_DEPTH = 6;
const OVERLAY_Z_INDEX = 2147483647;

export const INSPECTOR_SCRIPT = `(function () {
  if (window.__awInspector) return;
  window.__awInspector = true;
  var enabled = false;
  var hovered = null;
  var cursorCss = 'url("data:image/svg+xml;base64,${INSPECTOR_CURSOR_BASE64}") 9 9, crosshair';
  var style = document.createElement("style");
  style.setAttribute("data-aw-inspector-styles", "true");
  var overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.cssText = "position:fixed;pointer-events:none;display:none;z-index:${OVERLAY_Z_INDEX};outline:${OUTLINE_WIDTH_PX}px solid ${OUTLINE_COLOR};outline-offset:-${OUTLINE_WIDTH_PX}px;background:rgba(227,252,24,0.14);box-shadow:0 0 0 1px rgba(8,8,9,0.7),inset 0 0 0 1px rgba(8,8,9,0.5);border-radius:3px;transition:top 0.05s ease-out,left 0.05s ease-out,width 0.05s ease-out,height 0.05s ease-out;";
  var badge = document.createElement("span");
  badge.setAttribute("aria-hidden", "true");
  badge.style.cssText = "position:absolute;top:-22px;left:0;height:18px;line-height:18px;background:#080809;color:#e3fc18;border:1px solid #e3fc18;font-size:11px;font-family:ui-monospace,monospace;padding:0 6px;border-radius:4px;font-weight:700;pointer-events:none;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.6);display:none;";
  overlay.appendChild(badge);
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
    badge.textContent = el.tagName.toLowerCase();
    badge.style.display = "inline-block";
    if (rect.top < 24) {
      badge.style.top = "2px";
      badge.style.left = "2px";
    } else {
      badge.style.top = "-22px";
      badge.style.left = "0";
    }
  }
  function clear() {
    hovered = null;
    overlay.style.display = "none";
    badge.style.display = "none";
  }
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
  window.addEventListener("scroll", function () {
    if (hovered && enabled) draw(hovered);
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
    if (enabled) {
      style.textContent = "* { cursor: " + cursorCss + " !important; }";
      if (!document.head.contains(style)) document.head.appendChild(style);
      document.documentElement.style.cursor = cursorCss;
    } else {
      if (style.parentNode) style.parentNode.removeChild(style);
      document.documentElement.style.cursor = "";
      clear();
    }
  });
  document.documentElement.appendChild(overlay);
  window.parent.postMessage({ type: "${INSPECTOR_MESSAGE.ready}" }, "*");
})();`;
