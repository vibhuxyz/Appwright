import type { VerificationError } from "@repo/contracts";

export function parseTscErrors(rawOutput: string): VerificationError[] {
  if (!rawOutput.trim()) return [];
  const lines = rawOutput.split(/\r?\n/);
  const errors: VerificationError[] = [];

  for (const line of lines) {
    const colonMatch = line.match(/^(.+?):(\d+):(\d+)\s*-\s*error\s*TS\d+:\s*(.+)$/);
    if (colonMatch?.[1] && colonMatch[2] && colonMatch[3] && colonMatch[4]) {
      errors.push({
        file: colonMatch[1].trim(),
        line: Number(colonMatch[2]),
        col: Number(colonMatch[3]),
        message: colonMatch[4].trim(),
      });
      continue;
    }

    const parenMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s*TS\d+:\s*(.+)$/);
    if (parenMatch?.[1] && parenMatch[2] && parenMatch[3] && parenMatch[4]) {
      errors.push({
        file: parenMatch[1].trim(),
        line: Number(parenMatch[2]),
        col: Number(parenMatch[3]),
        message: parenMatch[4].trim(),
      });
      continue;
    }

    if (line.includes("error TS")) {
      errors.push({
        message: line.trim(),
      });
    }
  }

  return errors;
}

export function parseBuildErrors(rawOutput: string): VerificationError[] {
  if (!rawOutput.trim()) return [];
  const lines = rawOutput.split(/\r?\n/);
  const errors: VerificationError[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.toLowerCase().includes("error:") ||
      trimmed.startsWith("Error:") ||
      trimmed.includes("ERR!")
    ) {
      errors.push({ message: trimmed });
    }
  }

  return errors;
}

const STYLISH_FILE = /^\S.*\.[cm]?[jt]sx?$/;
const STYLISH_ROW = /^\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)(?:\s{2,}[\w@/-]+)?$/;

function parseStylishLintErrors(lines: readonly string[]): VerificationError[] {
  const errors: VerificationError[] = [];
  let file: string | undefined;
  for (const line of lines) {
    if (STYLISH_FILE.test(line)) {
      file = line.trim();
      continue;
    }
    const row = STYLISH_ROW.exec(line);
    if (!file || row?.[1] === undefined || row[2] === undefined || row[3] !== "error" || row[4] === undefined) continue;
    errors.push({ file, line: Number(row[1]), col: Number(row[2]), message: row[4].trim() });
  }
  return errors;
}

export function parseLintErrors(rawOutput: string): VerificationError[] {
  if (!rawOutput.trim()) return [];
  const lines = rawOutput.split(/\r?\n/);
  const stylish = parseStylishLintErrors(lines);
  if (stylish.length > 0) return stylish;
  const errors: VerificationError[] = [];

  for (const line of lines) {
    const match = line.match(/^(.+?): line (\d+), col (\d+), Error - (.+)$/);
    if (match?.[1] && match[2] && match[3] && match[4]) {
      errors.push({
        file: match[1].trim(),
        line: Number(match[2]),
        col: Number(match[3]),
        message: match[4].trim(),
      });
      continue;
    }
    if (line.includes("error") && !line.includes("0 errors")) {
      errors.push({ message: line.trim() });
    }
  }

  return errors;
}
