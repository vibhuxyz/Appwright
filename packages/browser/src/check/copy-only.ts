const FILE_HEADER = /^\+\+\+ b\/(.+)$/;
const SCRIPT_FILE = /\.[cm]?[jt]sx?$/;
const STRING_LITERAL = /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'|`(?:[^`\\$]|\\.)*`/g;
const JSX_TEXT = />[^<>{}]*</g;
const CODE_CHARACTER = /[<>{}=();]/;
const STYLE_CONTEXT = /\b(?:className|class|style|cn|clsx|cva|twMerge)\b/;
const CLASS_TOKEN = /^(?:[a-z0-9-]+:)*-?[a-z][a-z0-9-]*(?:\/\d+)?$/;
const MIN_CLASS_TOKENS = 2;
const CLASS_TOKEN_RATIO = 0.5;
const MIN_LENGTH_SLACK = 40;
const LENGTH_SLACK_RATIO = 0.5;

interface FileDiff {
  path: string;
  removed: string[];
  added: string[];
  isAligned: boolean;
}

function looksLikeClassList(literal: string): boolean {
  const tokens = literal.slice(1, -1).trim().split(/\s+/).filter(Boolean);
  if (tokens.length < MIN_CLASS_TOKENS || !tokens.every((token) => CLASS_TOKEN.test(token))) return false;
  const styled = tokens.filter((token) => token.includes("-") || token.includes(":")).length;
  return styled / tokens.length >= CLASS_TOKEN_RATIO;
}

function normalise(line: string): string {
  if (STYLE_CONTEXT.test(line)) return line.trim();
  const withoutStrings = line
    .replace(STRING_LITERAL, (literal) => (looksLikeClassList(literal) ? literal : '""'))
    .replace(JSX_TEXT, "><")
    .trim();
  return CODE_CHARACTER.test(withoutStrings) ? withoutStrings : "TEXT";
}

function textLength(lines: readonly string[]): number {
  return lines.reduce((sum, line) => sum + line.trim().length, 0);
}

function parseDiff(diff: string): FileDiff[] {
  const files: FileDiff[] = [];
  let hunkRemoved = 0;
  let hunkAdded = 0;
  const closeHunk = () => {
    const current = files.at(-1);
    if (current && hunkRemoved !== hunkAdded) current.isAligned = false;
    hunkRemoved = 0;
    hunkAdded = 0;
  };
  for (const line of diff.split(/\r?\n/)) {
    const header = FILE_HEADER.exec(line);
    if (header?.[1]) {
      closeHunk();
      files.push({ path: header[1], removed: [], added: [], isAligned: true });
      continue;
    }
    const current = files.at(-1);
    if (!current || line.startsWith("--- ")) continue;
    if (line.startsWith("@@")) closeHunk();
    else if (line.startsWith("-")) {
      current.removed.push(line.slice(1));
      hunkRemoved += 1;
    } else if (line.startsWith("+")) {
      current.added.push(line.slice(1));
      hunkAdded += 1;
    }
  }
  closeHunk();
  return files;
}

function isCopyOnly(file: FileDiff): boolean {
  if (!SCRIPT_FILE.test(file.path) || !file.isAligned || file.added.length === 0) return false;
  if (!file.removed.every((line, index) => normalise(line) === normalise(file.added[index] ?? ""))) return false;
  const before = textLength(file.removed);
  const slack = Math.max(MIN_LENGTH_SLACK, before * LENGTH_SLACK_RATIO);
  return Math.abs(textLength(file.added) - before) <= slack;
}

export function copyOnlyPaths(diff: string): string[] {
  return parseDiff(diff).filter(isCopyOnly).map((file) => file.path).sort();
}
