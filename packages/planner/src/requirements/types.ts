export const NEED_NAMES = [
  "auth",
  "payments",
  "realtime",
  "admin",
  "search",
  "fileUpload",
] as const;

export type NeedName = (typeof NEED_NAMES)[number];

export type NeedSource = "explicit" | "inferred" | "default";

export interface DetectedNeed {
  required: boolean;
  confidence: number;
  source: NeedSource;
  evidence: readonly string[];
}

export type Needs = Readonly<Record<NeedName, DetectedNeed>>;

export interface Question {
  need: NeedName;
  text: string;
  defaultAnswer: boolean;
}
