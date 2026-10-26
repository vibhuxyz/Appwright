export type InlineSegment = { kind: "text" | "code" | "bold"; text: string };

export type MessageBlock =
  | { kind: "heading"; level: 1 | 2 | 3; segments: InlineSegment[] }
  | { kind: "list"; items: InlineSegment[][] }
  | { kind: "paragraph"; segments: InlineSegment[] };

const MAX_BLOCKS = 400;
const HEADING = /^(#{1,3})\s+(.+)$/;
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/;
const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*)/g;

export function parseInline(text: string): InlineSegment[] {
  return text.split(INLINE).flatMap((part): InlineSegment[] => {
    if (part.length === 0) return [];
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return [{ kind: "code", text: part.slice(1, -1) }];
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return [{ kind: "bold", text: part.slice(2, -2) }];
    return [{ kind: "text", text: part }];
  });
}

type LineKind =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "blank" }
  | { kind: "text"; text: string };

function classifyLine(line: string): LineKind {
  const heading = HEADING.exec(line);
  if (heading?.[1] && heading[2]) return { kind: "heading", level: Math.min(heading[1].length, 3) as 1 | 2 | 3, text: heading[2].trim() };
  const bullet = BULLET.exec(line);
  if (bullet?.[1]) return { kind: "bullet", text: bullet[1].trim() };
  return line.trim().length === 0 ? { kind: "blank" } : { kind: "text", text: line };
}

function appendLine(blocks: MessageBlock[], line: LineKind, previous: LineKind | undefined): void {
  const last = blocks.at(-1);
  if (line.kind === "heading") blocks.push({ kind: "heading", level: line.level, segments: parseInline(line.text) });
  else if (line.kind === "bullet" && last?.kind === "list") last.items.push(parseInline(line.text));
  else if (line.kind === "bullet") blocks.push({ kind: "list", items: [parseInline(line.text)] });
  else if (line.kind === "text" && previous?.kind === "text" && last?.kind === "paragraph") last.segments.push({ kind: "text", text: "\n" }, ...parseInline(line.text));
  else if (line.kind === "text") blocks.push({ kind: "paragraph", segments: parseInline(line.text) });
}

export function parseMessageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const lines = text.split(/\r?\n/).map(classifyLine);
  lines.forEach((line, index) => appendLine(blocks, line, lines[index - 1]));
  if (blocks.length <= MAX_BLOCKS) return blocks;
  return [
    ...blocks.slice(0, MAX_BLOCKS),
    { kind: "paragraph", segments: [{ kind: "text", text: `(+${blocks.length - MAX_BLOCKS} more blocks)` }] },
  ];
}
