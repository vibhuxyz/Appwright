export interface PromptSuggestion {
  label: string;
  appendText: string;
}

interface SuggestionRule {
  excludeIfIncludesAny: string[];
  label: string;
  appendText: string;
}

const VIDEO_RULES: SuggestionRule[] = [
  {
    excludeIfIncludesAny: ["valid", "embed"],
    label: "+ Valid YouTube Embed IDs",
    appendText:
      " using valid, embeddable YouTube video IDs (e.g. dQw4w9WgXcQ, kJQP7kiw5Fk) with https://www.youtube-nocookie.com/embed/{id}",
  },
  {
    excludeIfIncludesAny: ["categor"],
    label: "+ Categories (Mindset, Fitness, Tech)",
    appendText:
      " with category tabs (e.g. Mindset, Fitness, Tech, Career) with global count pill badges",
  },
  {
    excludeIfIncludesAny: ["modal", "player"],
    label: "+ Modal Player & Focus Trap",
    appendText: " with an embedded YouTube modal dialog that traps focus and closes on Escape",
  },
  {
    excludeIfIncludesAny: ["shortcut", "cmd+k"],
    label: "+ Cmd+K / Esc Shortcuts",
    appendText: " with Cmd+K to focus search and Escape to close modals",
  },
  {
    excludeIfIncludesAny: ["storage", "persist"],
    label: "+ Safe LocalStorage Fallback",
    appendText: " with safe try/catch localStorage helpers for bookmarks",
  },
];

const TODO_RULES: SuggestionRule[] = [
  {
    excludeIfIncludesAny: ["filter", "tab", "active", "done"],
    label: "+ Filter Tabs (All, Active, Done)",
    appendText: " with filter tabs for All, Active, and Done with live counts",
  },
  {
    excludeIfIncludesAny: ["badge", "status", "toggle"],
    label: "+ Interactive Status Badges",
    appendText: " with interactive status badges that toggle state immediately",
  },
  {
    excludeIfIncludesAny: ["storage", "persist"],
    label: "+ Safe LocalStorage Persistence",
    appendText: " and persist items in localStorage with safe try/catch fallbacks",
  },
  {
    excludeIfIncludesAny: ["shortcut", "cmd+k"],
    label: "+ Keyboard Shortcuts (Cmd+K)",
    appendText: " with Cmd+K keyboard shortcut to focus the task input",
  },
];

const SHOP_RULES: SuggestionRule[] = [
  {
    excludeIfIncludesAny: ["cart", "checkout"],
    label: "+ Cart Drawer & Checkout",
    appendText: " with an interactive slide-out cart and checkout summary",
  },
  {
    excludeIfIncludesAny: ["categor", "filter"],
    label: "+ Category Filter & Instant Search",
    appendText: " with category filter pills and instant client-side search",
  },
  {
    excludeIfIncludesAny: ["modal", "detail"],
    label: "+ Product Detail Modal & Esc Close",
    appendText: " and product detail dialog modal with Escape close support",
  },
];

const FALLBACK_RULES: SuggestionRule[] = [
  {
    excludeIfIncludesAny: ["data", "model", "interface"],
    label: "+ Define TypeScript Data Model",
    appendText: " with explicit TypeScript data interfaces and realistic seed data",
  },
  {
    excludeIfIncludesAny: ["filter", "categor", "tab"],
    label: "+ Category Filter Tabs & Counts",
    appendText: " with reactive filter tabs displaying live item counts",
  },
  {
    excludeIfIncludesAny: ["storage", "persist"],
    label: "+ Safe LocalStorage Persistence",
    appendText: " with safe try/catch localStorage fallback helpers",
  },
  {
    excludeIfIncludesAny: ["grid", "responsive", "card"],
    label: "+ Responsive Card Grid",
    appendText: " arranged in a modern responsive card grid with empty states",
  },
];

const TOPIC_RULES: { triggers: string[]; rules: SuggestionRule[] }[] = [
  { triggers: ["video", "youtube", "coach", "watch", "channel"], rules: VIDEO_RULES },
  { triggers: ["todo", "task", "manage", "list"], rules: TODO_RULES },
  { triggers: ["shop", "store", "ecommerce", "product", "cart"], rules: SHOP_RULES },
];

function applyRules(lower: string, rules: SuggestionRule[]): PromptSuggestion[] {
  return rules
    .filter((rule) => !rule.excludeIfIncludesAny.some((kw) => lower.includes(kw)))
    .map(({ label, appendText }) => ({ label, appendText }));
}

// Pure and keyword-driven on purpose — good enough to nudge a first-time
// prompt toward a spec the agent can act on without another model call.
export function getPromptSuggestions(text: string): PromptSuggestion[] {
  const lower = text.toLowerCase().trim();
  if (!lower) return [];

  const topic = TOPIC_RULES.find(({ triggers }) => triggers.some((kw) => lower.includes(kw)));
  let suggestions = topic ? applyRules(lower, topic.rules) : [];

  if (suggestions.length < 2) {
    suggestions = [...suggestions, ...applyRules(lower, FALLBACK_RULES)];
  }

  return suggestions.slice(0, 3);
}
