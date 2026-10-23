import type { Finding } from "../findings";
import type { ExploreReport } from "../explore";

const MAX_FINDINGS_LISTED = 20;
const MAX_NOTES_LISTED = 10;

export interface FormatOptions {
  readonly screenshotUrl?: (fileName: string) => string;
}

interface GroupedFinding {
  readonly finding: Finding;
  readonly viewports: readonly string[];
}

function groupFindings(findings: readonly Finding[]): GroupedFinding[] {
  const groups = new Map<string, { finding: Finding; viewports: string[] }>();
  for (const finding of findings) {
    const key = `${finding.kind}|${finding.route}|${finding.message}`;
    const group = groups.get(key);
    if (group) group.viewports.push(finding.viewport);
    else groups.set(key, { finding, viewports: [finding.viewport] });
  }
  return [...groups.values()];
}

function line(group: GroupedFinding, options: FormatOptions): string {
  const { finding, viewports } = group;
  const icon = finding.severity === "error" ? "❌" : "⚠️";
  const link =
    finding.screenshot && options.screenshotUrl
      ? ` ([screenshot](${options.screenshotUrl(finding.screenshot)}))`
      : finding.screenshot
        ? ` (screenshot: ${finding.screenshot})`
        : "";
  return `- ${icon} \`${finding.route}\` (${viewports.join(", ")}): ${finding.message}${link}`;
}

export function hasErrors(report: ExploreReport): boolean {
  return report.findings.some((finding) => finding.severity === "error");
}

function headerOf(report: ExploreReport): string {
  const sizes = report.pagesChecked / Math.max(report.routes.length, 1);
  return `Browser check: opened ${report.routes.length} page(s) at ${sizes} screen size(s), scrolled each one, followed their links, filled and submitted ${report.formsTested} form(s) and clicked ${report.buttonsClicked} button(s).`;
}

function notesOf(report: ExploreReport): string[] {
  if (report.notes.length === 0) return [];
  const listed = report.notes.slice(0, MAX_NOTES_LISTED).map((note) => `- ${note}`);
  const hidden = report.notes.length - listed.length;
  return ["Not tested:", ...listed, ...(hidden > 0 ? [`(+${hidden} more)`] : [])];
}

export function formatReport(report: ExploreReport, options: FormatOptions = {}): string {
  const header = headerOf(report);
  const notes = notesOf(report);
  if (report.findings.length === 0) return [`✅ ${header} No problems found.`, ...notes].join("\n");
  const groups = groupFindings(report.findings);
  const errors = groups.filter((group) => group.finding.severity === "error").length;
  const warnings = groups.length - errors;
  const listed = groups.slice(0, MAX_FINDINGS_LISTED).map((group) => line(group, options));
  const hidden = groups.length - listed.length;
  const more = hidden > 0 ? [`(+${hidden} more)`] : [];
  const title = `${errors > 0 ? "❌" : "⚠️"} ${header} Found ${errors} problem(s) and ${warnings} warning(s):`;
  return [title, ...listed, ...more, ...notes].join("\n");
}
