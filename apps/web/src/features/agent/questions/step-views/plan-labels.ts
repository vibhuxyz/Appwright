const HOME_ROUTE = "/";
const DYNAMIC_SEGMENT = /^\[.+\]$/;
const TECHNICAL_SECTION = /^(open graph|og|meta|seo|favicon|modal|carousel|skeleton|provider|layout|toast)\b/i;

const SECTION_LABELS: Readonly<Record<string, string>> = {
  hero: "Top banner",
  "hero split image": "Top banner photo",
  "brand intro": "Introduction",
  "gallery row": "Photo gallery",
  "location panel": "Location",
  "location photo": "Location photo",
  "about photo": "About photo",
  cta: "Call to action",
  faq: "Questions and answers",
  footer: "Footer",
  header: "Menu bar",
  navbar: "Menu bar",
};

function capitalise(word: string): string {
  return word.length > 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word;
}

export function pageTitle(route: string): string {
  if (route === HOME_ROUTE) return "Home page";
  const segments = route.split("/").filter((segment) => segment.length > 0);
  const last = segments.at(-1) ?? route;
  if (DYNAMIC_SEGMENT.test(last)) {
    const parent = segments.at(-2);
    return parent ? `Single ${parent.replace(/s$/i, "").replace(/[-_]+/g, " ")} page` : "Detail page";
  }
  return capitalise(last.replace(/[-_]+/g, " "));
}

export function isTechnicalSection(label: string): boolean {
  return TECHNICAL_SECTION.test(label.trim());
}

export function friendlySectionLabel(label: string): string {
  return SECTION_LABELS[label.trim().toLowerCase()] ?? label;
}
