import { normalizeProjectType } from "../universal/project-type";
import { detectScope } from "../universal/scope";
import { extractIdentityFromPrompt } from "./extract-identity";
import type { DomainSignals, ExtractedFacts } from "./types";
import { MAX_EXCLUSIONS, MAX_GOALS } from "./constants";

const EXCLUSION_PATTERNS: readonly (readonly [RegExp, string])[] = [
  [/\bno (online )?(ordering|orders|checkout|payments?|cart)\b/i, "ordering"],
  [/\bwithout (online )?(ordering|checkout|payments?)\b/i, "ordering"],
  [/\b(catalog|informational|browse[- ]only) only\b/i, "ordering"],
  [/\bno (accounts?|logins?|sign-?ups?)\b/i, "accounts"],
  [/\bwithout (accounts?|logins?)\b/i, "accounts"],
  [/\bno (custom|bespoke) (cakes?|orders?)\b/i, "custom-orders"],
  [/\bno (pop-?ups?|popup)\b/i, "popups"],
  [/\bno (sms|text messages?)\b/i, "sms"],
];

const ANSWER_PATTERNS: readonly (readonly [RegExp, string, string])[] = [
  [/\b(browse[- ]only|catalog only|informational only)\b/i, "ordering-mode", "Browse only"],
  [/\bstandard pickup orders?\b/i, "ordering-mode", "Pickup orders"],
  [/\bpickup orders?\b/i, "ordering-mode", "Pickup orders"],
  [/\b(delivery|deliver) orders?\b/i, "ordering-mode", "Delivery orders"],
  [/\b(custom cake|event requests?|custom orders?)\b/i, "custom-orders", "Yes, custom cake and event requests"],
  [/\bstorefront and pop-?up\b/i, "locations", "Storefront and pop-up locations"],
  [/\bpop-?up locations?\b/i, "locations", "Pop-up locations"],
  [/\bpay at pickup\b/i, "payment-method", "Pay at pickup"],
  [/\b(pay online|online payment|stripe)\b/i, "payment-method", "Pay online"],
  [/\bguest checkout\b/i, "guest-checkout", "Guest checkout"],
  [/\b(must (log|sign) ?in|required accounts?)\b/i, "guest-checkout", "Customer accounts required"],
];

function clipList(values: readonly string[], max: number): string[] {
  return [...new Set(values)].slice(0, max);
}

function collectExclusions(prompt: string): string[] {
  const found: string[] = [];
  for (const [pattern, name] of EXCLUSION_PATTERNS) {
    if (pattern.test(prompt)) found.push(name);
  }
  return clipList(found, MAX_EXCLUSIONS);
}

function collectAnswered(
  prompt: string,
  answers: Readonly<Record<string, string>>,
): Record<string, string> {
  const answered: Record<string, string> = { ...answers };
  for (const [pattern, id, value] of ANSWER_PATTERNS) {
    if (answered[id] !== undefined) continue;
    if (pattern.test(prompt)) answered[id] = value;
  }
  for (const [id, value] of Object.entries(extractIdentityFromPrompt(prompt))) {
    if (answered[id] !== undefined) continue;
    answered[id] = value;
  }
  return answered;
}

function collectGoals(prompt: string, signals: DomainSignals): string[] {
  const goals: string[] = [];
  if (signals.bakery) goals.push("Run a bakery with public pages for customers");
  if (signals.ordering && signals.pickup) goals.push("Let customers place pickup orders");
  if (signals.customOrders) goals.push("Take custom cake and event requests");
  if (signals.popups) goals.push("Operate pop-up locations alongside a storefront");
  if (signals.todoApp) goals.push("Track personal or shared tasks");
  if (signals.browseOnly) goals.push("Show a catalog without taking orders");
  if (goals.length === 0 && prompt.trim().length > 0) goals.push(prompt.trim().slice(0, 160));
  return clipList(goals, MAX_GOALS);
}

function detectSignals(prompt: string): DomainSignals {
  const browseOnly = detectScope(prompt).isBrowseOnly;
  const pickup = /\bpickup\b/i.test(prompt);
  const delivery = /\bdeliver(y|ies|ing)?\b/i.test(prompt);
  const customOrders = /\b(custom cake|event requests?|custom orders?|bespoke)\b/i.test(prompt);
  const ordering = !browseOnly && (/\border/i.test(prompt) || pickup || delivery || customOrders);
  return {
    bakery: /\bbakery|bakeries|patisserie|cake shop\b/i.test(prompt),
    todoApp: /\b(todo|to-do|task list|task manager)\b/i.test(prompt),
    commerce: /\b(shop|store|catalog|menu|checkout|cart|orders?)\b/i.test(prompt),
    browseOnly,
    ordering,
    pickup: ordering && pickup,
    delivery: ordering && delivery,
    customOrders: ordering && customOrders,
    popups: /\bpop-?ups?\b/i.test(prompt),
    storefront: /\b(storefront|shopfront|retail (shop|store)|physical (shop|store))\b/i.test(prompt),
    paymentsMentioned: /\b(pay|payment|checkout|stripe|card)\b/i.test(prompt),
    accountsMentioned: /\b(account|log ?in|sign ?up|guest)\b/i.test(prompt),
    adminMentioned: /\b(admin|staff dashboard|back office)\b/i.test(prompt),
    existingAdmin: /\b(existing|already have|current) (an )?admin\b/i.test(prompt),
    existingImages: /\b(existing|our own|brand) (photos?|images?|assets?|logo)\b/i.test(prompt),
  };
}

export function extractFacts(
  prompt: string,
  answers: Readonly<Record<string, string>> = {},
): ExtractedFacts {
  const signals = detectSignals(prompt);
  const exclusions = collectExclusions(prompt);
  const answered = collectAnswered(prompt, answers);
  if (exclusions.includes("ordering")) {
    answered["ordering-mode"] = answered["ordering-mode"] ?? "Browse only";
  }
  return {
    prompt,
    projectType: normalizeProjectType({ type: "app", domain: prompt, complexity: "medium" }, prompt),
    goals: collectGoals(prompt, signals),
    exclusions,
    answered,
    signals,
  };
}
