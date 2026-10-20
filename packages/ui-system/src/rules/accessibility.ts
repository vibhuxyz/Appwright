import type { RuleCheckResult, RuleViolation } from "./types";

export function checkAccessibilityRules(code: string): RuleCheckResult {
  const violations: RuleViolation[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;

    if (/<img\b/i.test(line) && !/alt=["'{]/i.test(line)) {
      violations.push({
        rule: "img-alt-required",
        category: "accessibility",
        message: "Image element must have an alt attribute",
        line: lineNumber,
        snippet: line.trim(),
      });
    }

    if (/<button\b/i.test(line) && !/aria-label=/i.test(line)) {
      if (/<(svg|span class=".*icon.*"|[A-Z]\w*Icon)\b/i.test(line) && !/>\s*[\w\d]+/i.test(line)) {
        violations.push({
          rule: "icon-button-aria-label",
          category: "accessibility",
          message: "Icon button must include an aria-label attribute",
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
