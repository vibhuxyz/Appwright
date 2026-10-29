import { PROMPT_ANALYSIS_LIMITS, type ErrorHintFile } from "@repo/contracts";

export interface ErrorHints {
  files: ErrorHintFile[];
  errorLines: string[];
}

const LIMITS = PROMPT_ANALYSIS_LIMITS;
const SOURCE_EXTENSIONS = "tsx?|jsx?|mjs|cjs|css|scss|json|prisma";
const FILE_REFERENCE = new RegExp(
  `((?:\\.{1,2}\\/|\\/)?(?:[\\w@.-]+\\/)*[\\w@.-]+\\.(?:${SOURCE_EXTENSIONS}))(?![\\w/])(?::(\\d+)(?::\\d+)?|\\((\\d+),\\d+\\)|\\s\\((\\d+):\\d+\\))?`,
  "g",
);
const ERROR_LINE = /\b(?:\w*Error\b|error TS\d+|Uncaught|Unhandled|Failed to compile|Module not found)/i;
const PROJECT_ROOT_MARKER = /(?:^|\/)((?:src|app|components|lib|pages|prisma|public)\/.*)$/;

function repoRelative(rawPath: string): string | undefined {
  if (rawPath.includes("node_modules/") || rawPath.includes("/.next/")) return undefined;
  const withoutDot = rawPath.replace(/^\.\//, "");
  if (!withoutDot.startsWith("/") && !withoutDot.startsWith("../")) return withoutDot;
  return PROJECT_ROOT_MARKER.exec(withoutDot)?.[1];
}

function lineNumber(match: RegExpExecArray): number | undefined {
  const text = match[2] ?? match[3] ?? match[4];
  return text === undefined ? undefined : Number.parseInt(text, 10);
}

function isPathLike(path: string, line: number | undefined): boolean {
  return path.includes("/") || line !== undefined;
}

function fileHints(text: string): ErrorHintFile[] {
  const byPath = new Map<string, ErrorHintFile>();
  for (const match of text.matchAll(FILE_REFERENCE)) {
    if (byPath.size >= LIMITS.maxHintFiles) break;
    const raw = match[1];
    const line = lineNumber(match);
    const path = raw === undefined ? undefined : repoRelative(raw);
    if (!path || path.length > LIMITS.maxPathChars || byPath.has(path) || !isPathLike(path, line)) continue;
    byPath.set(path, line === undefined ? { path } : { path, line });
  }
  return [...byPath.values()];
}

function errorLines(text: string): string[] {
  const lines = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    if (lines.size >= LIMITS.maxErrorLines) break;
    const flat = line.replace(/\s+/g, " ").trim();
    if (ERROR_LINE.test(flat)) lines.add(flat.slice(0, LIMITS.maxErrorLineChars));
  }
  return [...lines];
}

export function extractErrorHints(text: string): ErrorHints {
  return { files: fileHints(text), errorLines: errorLines(text) };
}
