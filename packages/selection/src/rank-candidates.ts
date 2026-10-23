import type { ElementSelection } from "@repo/contracts";
import {
  MAX_CANDIDATES,
  MAX_CLASS_TOKENS,
  MAX_TEXT_PROBE_CHARS,
  MIN_TEXT_LENGTH,
  TEXT_MATCH_SCORE,
} from "./constants";
import type { SourceCandidate, SourceFile } from "./types";

function classTokensOf(classes: string): string[] {
  return [...new Set(classes.split(/\s+/).filter((token) => token.length > 0))].slice(
    0,
    MAX_CLASS_TOKENS,
  );
}

function textProbeOf(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length >= MIN_TEXT_LENGTH ? flat.slice(0, MAX_TEXT_PROBE_CHARS) : "";
}

function lineOfOffset(content: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (content.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

function scoreFile(
  file: SourceFile,
  probe: string,
  tokens: readonly string[],
): SourceCandidate | undefined {
  const textOffset = probe ? file.content.indexOf(probe) : -1;
  const matchedTokens = tokens.filter((token) => file.content.includes(token));
  const score = (textOffset >= 0 ? TEXT_MATCH_SCORE : 0) + matchedTokens.length;
  if (score === 0) return undefined;
  const firstToken = matchedTokens[0];
  const anchor = textOffset >= 0 ? textOffset : firstToken ? file.content.indexOf(firstToken) : 0;
  return { path: file.path, line: lineOfOffset(file.content, anchor), score };
}

export function rankCandidates(
  files: readonly SourceFile[],
  selection: ElementSelection,
): SourceCandidate[] {
  const probe = textProbeOf(selection.text);
  const tokens = classTokensOf(selection.classes);
  return files
    .map((file) => scoreFile(file, probe, tokens))
    .filter((candidate): candidate is SourceCandidate => candidate !== undefined)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, MAX_CANDIDATES);
}
