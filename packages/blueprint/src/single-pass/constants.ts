export const MAX_SINGLE_PASS_PAGES = 4;
export const MAX_SINGLE_PASS_BRIEF_BYTES = 24_000;
export const MAX_BRIEF_PURPOSE_CHARS = 240;
export const MAX_BRIEF_COMPONENTS = 16;
export const MAX_BRIEF_SLOTS = 16;
export const BRIEF_TAG = "build-brief";
export const STORED_DATA_FEATURES: ReadonlySet<string> = new Set(["auth", "payments"]);

export const SINGLE_PASS_RULES = [
  "Build the whole site in this one pass: the shared header and footer in the root layout first, then each page in the order listed.",
  "This is a static site. Do not add a database, auth, rate limiters, middleware, upload APIs, or integration gateway code.",
  "The project tree is in the system prompt. Read only the files you need, once each, and do not explore the workspace.",
  "Split each page into section components as you write them so every file stays under 250 lines. Do not rewrite a file to shrink it later.",
  "Do not run installs, tsc or builds. Verification runs automatically after you stop, and you will get any errors to fix.",
  "Use only the business facts from the conversation. Do not invent prices, reviews, projects or contact details.",
] as const;
