export type FollowUpKind = "cosmetic" | "feature" | "architecture";

export interface FollowUpScope {
  kind: FollowUpKind;
  requiresConfirmation: boolean;
  affectedTaskIds: readonly string[];
  newTaskIds: readonly string[];
  untouchedTaskIds: readonly string[];
}
