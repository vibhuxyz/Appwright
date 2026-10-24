const SESSION_BRANCH_PREFIX = "agent/";
const SESSION_BRANCH_PATTERN = /^agent\/([A-Za-z0-9_-]{1,64})$/;

export interface SessionBranchRef {
  readonly id: string;
  readonly branch: string | null;
}

export function sessionBranchName(worktreeSessionId: string): string {
  return `${SESSION_BRANCH_PREFIX}${worktreeSessionId}`;
}

export function worktreeSessionIdOf(session: SessionBranchRef): string {
  return session.branch?.match(SESSION_BRANCH_PATTERN)?.[1] ?? session.id;
}
