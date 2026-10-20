import type { Blueprint } from "@repo/contracts";

export interface ChangeRequest {
  taskId: string;
  why: string;
  patch: Partial<Blueprint>;
  blocks: readonly string[];
}

export type ChangeRequestDecision =
  | { status: "rejected"; reason: string }
  | { status: "needs_confirmation"; blueprint: Blueprint }
  | {
      status: "approved";
      blueprint: Blueprint;
      affectedTaskIds: readonly string[];
    };
