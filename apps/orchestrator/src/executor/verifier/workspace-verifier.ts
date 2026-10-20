import type { VerificationResult } from "@repo/contracts";
import type { WorkspaceVerifier } from "../postgres";

export type VerifyWorkspace = (
  workspaceDir: string,
) => Promise<readonly VerificationResult[]>;

export function createWorkspaceVerifier(
  workspaceDir: string,
  verifyWorkspace: VerifyWorkspace,
): WorkspaceVerifier {
  return () => verifyWorkspace(workspaceDir);
}
