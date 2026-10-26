export const AGENT_QUESTION_LIMITS = {
  maxQuestions: 4,
  minOptions: 2,
  maxOptions: 4,
  maxLabelChars: 40,
  maxTextChars: 280,
  maxOptionChars: 80,
  maxOtherTextChars: 500,
  maxToolResultBytes: 2000,
} as const;

const MINUTE_MS = 60_000;

export const AGENT_WAIT_LIMITS = {
  askUserMs: 10 * MINUTE_MS,
  integrationMs: 15 * MINUTE_MS,
  blueprintMs: 10 * MINUTE_MS,
  safetyMarginMs: 2 * MINUTE_MS,
  minimumWaitMs: 30_000,
  pollMs: 1_000,
} as const;

export const AGENT_QUESTION_STATUSES = ["PENDING", "ANSWERED", "DISMISSED", "EXPIRED"] as const;

export const AGENT_QUESTION_INPUT_TYPES = ["single", "multiple"] as const;

export const AGENT_WAIT_STATUS = {
  answers: "Waiting for your answers",
  keys: "Waiting for you to connect integrations",
} as const;

export const AGENT_TOOL_RESULT_MARKERS = {
  answered: "The user answered your questions:",
  cancelled: "Cancelled:",
  error: "Error:",
  integrationConnected: "is connected in development",
} as const;
