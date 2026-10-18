export interface PlanIssue {
  code: string;
  message: string;
}

export type PlanResult<T> =
  { ok: true; value: T } | { ok: false; issues: PlanIssue[] };
