export const PLAYBOOK_IDS = ["commerce", "hospitality", "agency", "studio"] as const;

export type PlaybookId = (typeof PLAYBOOK_IDS)[number];

export interface PlaybookMotionBudget {
  readonly isSmoothScrollOn: boolean;
  readonly maxPinnedScenes: number;
}

export interface PlaybookTypography {
  readonly displayMinPx: number;
  readonly trackingEm: number;
}

export interface Playbook {
  readonly id: PlaybookId;
  readonly ids: readonly PlaybookId[];
  readonly examples: string;
  readonly hero: string;
  readonly heroSectionIds: readonly string[];
  readonly sectionOrder: readonly string[];
  readonly imageRules: readonly string[];
  readonly motion: PlaybookMotionBudget;
  readonly typography: PlaybookTypography;
  readonly backgrounds: string;
}
