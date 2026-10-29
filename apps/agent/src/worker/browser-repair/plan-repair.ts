import type { BrowserRecheck, Finding, FindingKind } from "@repo/browser";
import type { VisualIssue } from "@repo/agent-core";

const BLOCKING_KINDS: ReadonlySet<FindingKind> = new Set([
  "navigation-failed",
  "http-error",
  "page-error",
  "console-error",
  "horizontal-overflow",
  "broken-image",
  "empty-page",
]);
const MAX_LISTED = 12;
const MAX_CHANGED_FILES = 20;
const MAX_MESSAGE_CHARS = 300;
const RECHECK_VIEWPORTS_FOR_VISION = ["mobile", "desktop"] as const;

export interface RepairPlan {
  readonly findings: readonly Finding[];
  readonly issues: readonly VisualIssue[];
  readonly recheck: BrowserRecheck;
}

function flat(text: string): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length <= MAX_MESSAGE_CHARS ? single : `${single.slice(0, MAX_MESSAGE_CHARS - 1)}…`;
}

export function blockingFindings(findings: readonly Finding[]): Finding[] {
  return findings.filter((finding) => finding.severity === "error" && BLOCKING_KINDS.has(finding.kind));
}

export function planRepair(findings: readonly Finding[], issues: readonly VisualIssue[]): RepairPlan | null {
  const blocking = blockingFindings(findings);
  const severe = issues.filter((issue) => issue.severity === "severe");
  if (blocking.length === 0 && severe.length === 0) return null;
  const routes = new Set([...blocking.map((finding) => finding.route), ...severe.map((issue) => issue.route)]);
  const viewports = new Set<string>([...blocking.map((finding) => finding.viewport)]);
  if (severe.length > 0) RECHECK_VIEWPORTS_FOR_VISION.forEach((viewport) => viewports.add(viewport));
  return {
    findings: blocking,
    issues: severe,
    recheck: { routes: [...routes].sort(), viewports: [...viewports].sort() },
  };
}

export interface RepairContext {
  readonly skill: string;
  readonly changedPaths: readonly string[];
  readonly extraMustFix?: readonly string[];
}

function extraLines(items: readonly string[] | undefined): string[] {
  if (!items || items.length === 0) return [];
  return ["", "Testing review also requires:", ...items.slice(0, MAX_LISTED).map((item) => `- ${flat(item)}`)];
}

function findingLine(finding: Finding): string {
  const evidence = finding.screenshot ? ` Screenshot: ${flat(finding.screenshot)}.` : "";
  return `- [browser] ${finding.route} (${finding.viewport}) ${finding.kind}: ${flat(finding.message)}${evidence}`;
}

function changedFileLines(changedPaths: readonly string[]): string[] {
  if (changedPaths.length === 0) return [];
  const sorted = [...changedPaths].sort();
  const shown = sorted.slice(0, MAX_CHANGED_FILES).map((path) => `- ${flat(path)}`);
  const hidden = sorted.length - shown.length;
  return ["", "Files changed in this run; the cause is most likely in one of them:", ...shown, ...(hidden > 0 ? [`(+${hidden} more)`] : [])];
}

export function describeRemaining(findings: readonly Finding[]): string {
  const listed = findings.slice(0, MAX_LISTED).map((finding) => `${finding.route} (${finding.viewport}) ${finding.kind}`);
  const hidden = findings.length - listed.length;
  return [...listed, ...(hidden > 0 ? [`+${hidden} more`] : [])].join("; ");
}

export function formatRepairPrompt(plan: RepairPlan, context: RepairContext): string {
  const listed = [
    ...plan.findings.map(findingLine),
    ...plan.issues.map((issue) => `- [visual review, AI judgement] ${issue.route} (${issue.viewport}) ${flat(issue.area)}: ${flat(issue.problem)} Suggested fix: ${flat(issue.fix)}`),
  ];
  const shown = listed.slice(0, MAX_LISTED);
  const hidden = listed.length - shown.length;
  return [
    "The browser check of the pages you just built found these problems. Fix the cause in the source, then stop.",
    "Browser lines were measured in a real browser. Visual review lines are a model's judgement of screenshots; fix them only when the source confirms the problem.",
    "<browser-findings>",
    ...shown.map((line) => line.replaceAll("</browser-findings>", "<\\/browser-findings>")),
    ...(hidden > 0 ? [`(+${hidden} more)`] : []),
    "</browser-findings>",
    ...changedFileLines(context.changedPaths),
    "",
    "Change only the code that causes these findings. Do not restyle, reorder or delete other sections, and keep every data-section attribute.",
    `After you stop, the platform rechecks ${plan.recheck.routes.join(", ")} at ${plan.recheck.viewports.join(", ")}. Anything still failing is reported to the user as failing.`,
    ...extraLines(context.extraMustFix),
    ...(context.skill ? ["", context.skill] : []),
  ].join("\n");
}
