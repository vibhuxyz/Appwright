import { autoMergeSession } from "./auto-merge-session";
import { commitSessionCheckpoint } from "./commit-checkpoint";
import type { MessageRow } from "./message-mapper";

export interface FinalizeRunParams {
  projectId: string;
  sessionId: string;
  prompt: string;
  verificationPassed: boolean;
  persist: (fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }) => Promise<MessageRow>;
}

export async function finalizeRun(params: FinalizeRunParams): Promise<void> {
  const { projectId, sessionId, prompt, verificationPassed, persist } = params;

  await commitSessionCheckpoint(projectId, sessionId, prompt);

  if (!verificationPassed) return;

  const merge = await autoMergeSession(projectId, sessionId);
  await persist({
    role: "assistant",
    type: "text",
    content: merge.merged
      ? "✅ Verified (typecheck + lint passed) and merged to main."
      : merge.conflict
        ? `⚠️ Verification passed, but the merge to main hit a conflict: ${merge.message}. Resolve it in the Diff tab.`
        : `⚠️ Verification passed, but merging to main failed: ${merge.message}. Try Merge in the Diff tab.`,
    data: { merge },
  });
}
