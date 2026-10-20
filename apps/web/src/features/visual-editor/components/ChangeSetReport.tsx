import { Badge } from "@/shared/components/ui/Badge";
import type { CompileResult, SubmitResult } from "../schemas/editor-schemas";

const MAX_LISTED = 40;

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function CompileReport({ result }: { result: CompileResult }) {
  if (result.status === "rejected") {
    return (
      <ul role="alert" className="space-y-1 text-xs text-danger">
        {result.issues.slice(0, MAX_LISTED).map((issue, index) => (
          <li key={`${issue.code}:${index}`}>
            {issue.componentId ? `${issue.componentId}: ` : ""}
            {issue.message}
          </li>
        ))}
        {result.issues.length > MAX_LISTED && <li>(+{result.issues.length - MAX_LISTED} more)</li>}
      </ul>
    );
  }
  const { plan } = result;
  return (
    <div className="space-y-1 text-xs text-foreground-secondary">
      <p>
        {result.exactCount} exact (no model) · {result.intentCount} via model · {plan.tasks.length} tasks in{" "}
        {plan.levels.length} levels · est. {formatCost(plan.estimatedCostCents)}
      </p>
      {plan.ownershipConflicts.length > 0 && (
        <p>Serialised on shared files: {plan.ownershipConflicts.map(([a, b]) => `${a} → ${b}`).join(", ")}</p>
      )}
      {plan.warnings.slice(0, MAX_LISTED).map((warning) => (
        <p key={warning.code + warning.message} className="text-warning">
          {warning.message}
        </p>
      ))}
      <p>Files: {result.affectedFiles.slice(0, MAX_LISTED).join(", ") || "none"}</p>
    </div>
  );
}

function SubmitReport({ result }: { result: SubmitResult }) {
  return (
    <div className="space-y-1 text-xs">
      <p className="flex items-center gap-2">
        <Badge tone={result.status === "applied" ? "success" : "danger"}>{result.status}</Badge>
        <span className="text-muted">{result.llmTokens} LLM tokens</span>
      </p>
      {result.error && <p className="text-danger">{result.error}</p>}
      <ul>
        {result.checks.slice(0, MAX_LISTED).map((check) => (
          <li key={`${check.componentId}:${check.property}`} className={check.passed ? "text-success" : "text-danger"}>
            {check.passed ? "✓" : "✗"} {check.componentId} {check.property}: asked {check.asked},{" "}
            {check.passed ? "measured" : "rendered"} {check.rendered}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ChangeSetReportProps {
  compiled: CompileResult | null;
  submitted: SubmitResult | null;
}

export function ChangeSetReport({ compiled, submitted }: ChangeSetReportProps) {
  if (!compiled && !submitted) return null;
  return (
    <div className="space-y-2 border-b border-border-soft px-4 py-2">
      {compiled && <CompileReport result={compiled} />}
      {submitted && <SubmitReport result={submitted} />}
    </div>
  );
}
