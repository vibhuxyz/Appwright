import { registry, type RegistryEntry } from "../registry";
import { RawEscapeTracker } from "./raw-escape-tracker";
import type { UiValidationResult, ValidationIssue } from "./types";

const BRACKET_VALUE_REGEX = /(?:[a-zA-Z0-9_-]+)-\[([^[\]]+)\]/g;
const UI_IMPORT_REGEX = /(?:from\s+['"](?:@\/|\.\.\/|\.\/)?(?:src\/)?components\/ui\/([a-zA-Z0-9_-]+)['"])|(?:import\s*{\s*([^}]+)\s*}\s*from\s+['"](?:@\/|\.\.\/|\.\/)?(?:src\/)?components\/ui(?:\/([a-zA-Z0-9_-]+))?['"])/g;

function checkLineEscapes(
  line: string,
  lineNumber: number,
  filePath: string | undefined,
  tracker: RawEscapeTracker,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  BRACKET_VALUE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BRACKET_VALUE_REGEX.exec(line)) !== null) {
    const rawVal = match[1] ?? "";
    const fullMatch = match[0] ?? "";
    tracker.record(rawVal, { file: filePath, line: lineNumber });
    issues.push({
      type: "off_scale_value",
      message: `Off-scale arbitrary bracket value "${fullMatch}" is forbidden. Compose from tokens.`,
      file: filePath,
      line: lineNumber,
      raw: fullMatch,
    });
  }
  return issues;
}

function checkImportRegistry(
  line: string,
  lineNumber: number,
  filePath: string | undefined,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  UI_IMPORT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = UI_IMPORT_REGEX.exec(line)) !== null) {
    const fileTarget = match[1] ?? match[4];
    const namedImports = match[2];

    if (fileTarget) {
      const pascalName = fileTarget.charAt(0).toUpperCase() + fileTarget.slice(1);
      const isKnown = Object.keys(registry).some(
        (key) => key.toLowerCase() === fileTarget.replaceAll("-", "").toLowerCase(),
      );
      if (!isKnown) {
        issues.push({
          type: "unregistered_component",
          message: `Unregistered UI component file "${fileTarget}" imported.`,
          file: filePath,
          line: lineNumber,
          raw: fileTarget,
        });
      }
    }

    if (namedImports) {
      const names = namedImports.split(",").map((n) => n.trim().split(/\s+as\s+/)[0]?.trim() ?? "");
      for (const name of names) {
        if (!name) continue;
        const inRegistry = name in registry;
        const inParts = (Object.values(registry) as RegistryEntry[]).some((entry) =>
          entry.parts?.includes(name),
        );
        if (!inRegistry && !inParts) {
          issues.push({
            type: "unregistered_component",
            message: `Unregistered component "${name}" imported from components/ui.`,
            file: filePath,
            line: lineNumber,
            raw: name,
          });
        }
      }
    }
  }
  return issues;
}

export function validateUiSource(
  code: string,
  filePath?: string,
  existingTracker?: RawEscapeTracker,
): UiValidationResult {
  const tracker = existingTracker ?? new RawEscapeTracker();
  const issues: ValidationIssue[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;
    issues.push(...checkLineEscapes(line, lineNumber, filePath, tracker));
    issues.push(...checkImportRegistry(line, lineNumber, filePath));
  }

  return {
    valid: issues.length === 0,
    issues,
    escapes: tracker.getEscapes(),
    missingTokenSuggestions: tracker.getMissingTokenSuggestions(),
  };
}
