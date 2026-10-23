import type { NeedName } from "./types";

export const EXPLICIT_CONFIDENCE = 0.95;
export const INFERRED_CONFIDENCE = 0.6;
export const DEFAULT_CONFIDENCE = 0.8;
export const QUESTION_CONFIDENCE_THRESHOLD = 0.7;
export const MAX_QUESTIONS = 8;
export const MAX_GAP_QUESTIONS = 3;
export const MAX_PROMPT_CHARS = 4000;
export const MAX_QUESTION_NEED_CHARS = 40;
export const MAX_QUESTION_TEXT_CHARS = 240;
export const MAX_QUESTION_LABEL_CHARS = 40;
export const MAX_QUESTION_WHY_CHARS = 280;
export const MAX_EVIDENCE_PER_NEED = 5;
export const MIN_QUESTION_OPTIONS = 2;
export const MAX_QUESTION_OPTIONS = 8;
export const MAX_QUESTION_OPTION_CHARS = 60;

export const EXPLICIT_PATTERNS: Readonly<Record<NeedName, readonly RegExp[]>> = {
  auth: [/\b(log ?in|sign ?(up|in)|authenticat\w*|accounts?|passwords?)\b/i],
  payments: [/\b(payments?|checkout|stripe|subscriptions?|billing|pay for)\b/i],
  realtime: [/\b(real-?time|live (updates?|tracking|chat)|chat|websockets?)\b/i],
  admin: [/\b(admin|dashboard for staff|back ?office|moderat\w*)\b/i],
  search: [/\b(search|filter(ing)?|find\b)/i],
  fileUpload: [/\b(upload\w*|attachments?|images? upload|photos?)\b/i],
};

export const INFERRED_PATTERNS: Readonly<Record<NeedName, readonly RegExp[]>> = {
  auth: [/\b(orders?|cart|marketplace|profiles?|my [a-z]+|saved)\b/i],
  payments: [/\b(shop|store|marketplace|delivery|buy|sell|cart)\b/i],
  realtime: [/\b(delivery|tracking|notifications?|messag\w*)\b/i],
  admin: [/\b(marketplace|store|shop|manage|inventory)\b/i],
  search: [/\b(catalog|listings?|directory|marketplace|restaurants?)\b/i],
  fileUpload: [/\b(profile|portfolio|gallery|listing)\b/i],
};

export const DEFAULT_REQUIRED: Readonly<Record<NeedName, boolean>> = {
  auth: true,
  payments: false,
  realtime: false,
  admin: false,
  search: false,
  fileUpload: false,
};

export const QUESTION_IMPACT: Readonly<Record<NeedName, number>> = {
  payments: 5,
  realtime: 4,
  auth: 3,
  fileUpload: 3,
  admin: 2,
  search: 1,
};

export const QUESTION_TEXT: Readonly<Record<NeedName, string>> = {
  payments: "Do you need to take payments?",
  realtime: "Should updates appear live without refreshing?",
  auth: "Do people need accounts to use it?",
  fileUpload: "Will users upload files or images?",
  admin: "Do you need an admin area for managing content?",
  search: "Do you need search or filtering?",
};
