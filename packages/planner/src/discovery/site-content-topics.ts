import { topic } from "./topic";
import type { MaterialTopic } from "./types";

const MENU_STRUCTURE = topic(
  "menu-structure",
  "Menu",
  "How should the menu be organized?",
  "Categories, a single list, or daily specials change the menu page layout and the admin editor.",
  ["By category (breads, cakes, pastries)", "One simple list", "Daily or seasonal specials"],
  0,
);

const OPENING_HOURS = topic(
  "opening-hours",
  "Hours",
  "When is the shop open? Pick one or type your own hours.",
  "Hours appear on the home page, the visit page, and in search results.",
  ["Mon–Sat, 8am–8pm", "Every day, 7am–9pm", "I'll add hours later"],
  2,
);

const SITE_PAGES = topic(
  "site-pages",
  "Pages",
  "Which pages should the site have?",
  "Each page becomes a route with its own sections and images.",
  ["Home", "Menu", "About us", "Visit us (map and hours)", "Gallery", "Reviews"],
  0,
  { inputType: "multiple" },
);

export function siteContentTopics(): readonly MaterialTopic[] {
  return [MENU_STRUCTURE, OPENING_HOURS, SITE_PAGES];
}
