import { topic } from "./topic";
import type { MaterialTopic } from "./types";

const PRIMARY_ACTION = topic(
  "primary-action",
  "Primary action",
  "What should visitors do first?",
  "The main button on every page and the contact section are built around this action.",
  ["Call you", "Message on WhatsApp", "Fill an enquiry form", "Book a visit"],
  0,
);

const WORK_SHOWCASE = topic(
  "work-showcase",
  "Your work",
  "How should your past work be shown?",
  "This decides whether the site gets a project gallery, service-by-service examples, or both.",
  ["Project gallery with photos", "Service-by-service examples", "Both"],
  2,
  { importance: "optional" },
);

const SITE_LANGUAGE = topic(
  "site-language",
  "Language",
  "What language should the site use?",
  "All headings, buttons and section copy are written in this language.",
  ["English", "Hindi", "English and Hindi"],
  0,
  { importance: "optional" },
);

const SERVICE_TOPICS: readonly MaterialTopic[] = [PRIMARY_ACTION, WORK_SHOWCASE, SITE_LANGUAGE];

export const GENERIC_SERVICE_TOPIC_IDS: ReadonlySet<string> = new Set(SERVICE_TOPICS.map((item) => item.id));

export function serviceBusinessTopics(): readonly MaterialTopic[] {
  return SERVICE_TOPICS;
}
