import type { RuleCheckResult, RuleViolation } from "./types";

const FIXED_DESKTOP_WIDTH_REGEX = /(?:w|min-w)-\[(\d+)px\]/g;

export function checkResponsiveRules(code: string): RuleCheckResult {
  const violations: RuleViolation[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;

    let match: RegExpExecArray | null;
    FIXED_DESKTOP_WIDTH_REGEX.lastIndex = 0;
    while ((match = FIXED_DESKTOP_WIDTH_REGEX.exec(line)) !== null) {
      const widthVal = Number.parseInt(match[1] ?? "0", 10);
      if (widthVal >= 600 && !/\b(sm|md|lg|xl):/.test(line)) {
        violations.push({
          rule: "no-unresponsive-fixed-desktop-width",
          category: "responsive",
          message: `Fixed width of ${widthVal}px without responsive breakpoint breaks mobile viewport`,
          line: lineNumber,
          snippet: line.trim(),
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
