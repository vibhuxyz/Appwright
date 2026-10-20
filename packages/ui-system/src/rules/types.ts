export interface RuleViolation {
  rule: string;
  category: "accessibility" | "responsive";
  message: string;
  line?: number;
  snippet?: string;
}

export interface RuleCheckResult {
  passed: boolean;
  violations: RuleViolation[];
}
