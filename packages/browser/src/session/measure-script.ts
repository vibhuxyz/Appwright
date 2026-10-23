import { MAX_LINKS } from "./constants";

const MAX_LISTED_ELEMENTS = 5;
const MAX_ELEMENT_TEXT_CHARS = 40;

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
    links,
  };
})()`;
