import { MAX_LINKS } from "./constants";

const MAX_LISTED_ELEMENTS = 5;
const MAX_ELEMENT_TEXT_CHARS = 40;
const MAX_TEXT_ELEMENTS = 300;
const MIN_OVERLAP_SHARE = 0.3;
const CLIP_TOLERANCE_PX = 2;
const MAX_CLIP_ANCESTORS = 4;

export const MEASURE_SCRIPT = `(() => {
  const viewportWidth = document.documentElement.clientWidth;
  const describe = (el) => {
    const id = el.id ? "#" + el.id : "";
    const classes = typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".")
      : "";
    const text = (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, ${MAX_ELEMENT_TEXT_CHARS});
    return el.tagName.toLowerCase() + id + classes + (text ? ' "' + text + '"' : "");
  };
  const isVisible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };
  const hasName = (el) => {
    if (el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("aria-labelledby")) return true;
    if (el.labels && el.labels.length > 0) return true;
    if (el.tagName === "INPUT" && ["submit", "button", "reset"].includes(el.type) && el.value) return true;
    if ((el.textContent || "").trim()) return true;
    return Boolean(el.querySelector('img[alt]:not([alt=""]), svg title'));
  };
  const scrollWidth = document.documentElement.scrollWidth;
  const overflowing = scrollWidth > viewportWidth + 1
    ? [...document.body.querySelectorAll("*")]
        .filter((el) => isVisible(el) && el.getBoundingClientRect().right > viewportWidth + 1)
        .slice(0, ${MAX_LISTED_ELEMENTS})
        .map(describe)
    : [];
  const brokenImages = [...document.images]
    .filter((img) => img.complete && img.naturalWidth === 0 && img.currentSrc)
    .slice(0, ${MAX_LISTED_ELEMENTS})
    .map((img) => img.currentSrc);
  const unlabelledControls = [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea")]
    .filter((el) => isVisible(el) && !hasName(el))
    .slice(0, ${MAX_LISTED_ELEMENTS})
    .map(describe);
  const TEXT_SELECTOR = "h1,h2,h3,h4,h5,h6,p,a,button,li,dt,dd,label,span";
  const hasOwnText = (el) => [...el.childNodes].some((node) => node.nodeType === 3 && (node.textContent || "").trim().length > 0);
  const isExempt = (el) => Boolean(el.closest('[aria-hidden="true"], [data-allow-clip], .sr-only'));
  const isPinned = (el) => {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "fixed" || position === "sticky") return true;
    }
    return false;
  };
  const textElements = [...document.body.querySelectorAll(TEXT_SELECTOR)]
    .filter((el) => hasOwnText(el) && isVisible(el) && !isExempt(el))
    .filter((el) => { const rect = el.getBoundingClientRect(); return rect.width > 1 && rect.height > 1; })
    .slice(0, ${MAX_TEXT_ELEMENTS});
  const clips = (style) => ["hidden", "clip"].includes(style.overflowX) || ["hidden", "clip"].includes(style.overflowY);
  const isClipped = (el) => {
    const style = getComputedStyle(el);
    if (style.textOverflow === "ellipsis" || (style.webkitLineClamp && style.webkitLineClamp !== "none")) return false;
    if (clips(style) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) return true;
    const rect = el.getBoundingClientRect();
    let ancestor = el.parentElement;
    for (let depth = 0; ancestor && depth < ${MAX_CLIP_ANCESTORS}; depth += 1, ancestor = ancestor.parentElement) {
      if (!clips(getComputedStyle(ancestor))) continue;
      const box = ancestor.getBoundingClientRect();
      return rect.bottom > box.bottom + ${CLIP_TOLERANCE_PX} || rect.right > box.right + ${CLIP_TOLERANCE_PX}
        || rect.top < box.top - ${CLIP_TOLERANCE_PX} || rect.left < box.left - ${CLIP_TOLERANCE_PX};
    }
    return false;
  };
  const clippedText = textElements.filter(isClipped).slice(0, ${MAX_LISTED_ELEMENTS}).map(describe);
  const placed = textElements.filter((el) => !isPinned(el)).map((el) => ({ el, rect: el.getBoundingClientRect() }));
  const overlappingText = [];
  for (let i = 0; i < placed.length && overlappingText.length < ${MAX_LISTED_ELEMENTS}; i += 1) {
    for (let j = i + 1; j < placed.length && overlappingText.length < ${MAX_LISTED_ELEMENTS}; j += 1) {
      const a = placed[i];
      const b = placed[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (width <= 0 || height <= 0) continue;
      const smaller = Math.min(a.rect.width * a.rect.height, b.rect.width * b.rect.height);
      if (width * height >= smaller * ${MIN_OVERLAP_SHARE}) overlappingText.push(describe(a.el) + " overlaps " + describe(b.el));
    }
  }
  const links = [...new Set([...document.querySelectorAll("a[href]")]
    .map((a) => a.href.split("#")[0])
    .filter((href) => href.startsWith(location.origin)))]
    .slice(0, ${MAX_LINKS});
  return {
    viewportWidth,
    scrollWidth,
    bodyTextLength: (document.body.innerText || "").trim().length,
    overflowing,
    brokenImages,
    unlabelledControls,
    clippedText,
    overlappingText,
    links,
  };
})()`;
