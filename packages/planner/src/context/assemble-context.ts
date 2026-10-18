import { byteLength, truncateUtf8 } from "./bytes";
import { KEEP_ORDER, SECTION_SEPARATOR } from "./constants";
import { renderSection } from "./render-section";
import type {
  AssembleOptions,
  AssembledContext,
  ContextSection,
  DroppedSection,
} from "./types";

interface RenderedSection {
  section: ContextSection;
  block: string;
  blockBytes: number;
}

const KEEP_RANK = new Map<string, number>(KEEP_ORDER.map((kind, index) => [kind, index]));
const SEPARATOR_BYTES = byteLength(SECTION_SEPARATOR);

function compareSections(a: ContextSection, b: ContextSection): number {
  const rankDifference = (KEEP_RANK.get(a.kind) ?? 0) - (KEEP_RANK.get(b.kind) ?? 0);
  if (rankDifference !== 0) return rankDifference;
  if (a.source === b.source) return 0;
  return a.source < b.source ? -1 : 1;
}

function toRendered(section: ContextSection): RenderedSection {
  const block = renderSection(section);
  return { section, block, blockBytes: byteLength(block) };
}

function totalBytes(rendered: readonly RenderedSection[]): number {
  const blocks = rendered.reduce((sum, item) => sum + item.blockBytes, 0);
  return blocks + Math.max(0, rendered.length - 1) * SEPARATOR_BYTES;
}

export function assembleContext(
  sections: readonly ContextSection[],
  options: AssembleOptions,
): AssembledContext {
  const kept = [...sections].sort(compareSections).map(toRendered);
  const dropped: DroppedSection[] = [];

  while (totalBytes(kept) > options.maxBytes && kept.length > 1) {
    const removed = kept.pop();
    if (!removed) break;
    dropped.push({
      source: removed.section.source,
      kind: removed.section.kind,
      reason: `Dropped to fit the ${options.maxBytes}-byte context budget`,
    });
  }

  const joined = kept.map((item) => item.block).join(SECTION_SEPARATOR);
  const isTruncated = byteLength(joined) > options.maxBytes;
  const text = isTruncated ? truncateUtf8(joined, options.maxBytes) : joined;

  return {
    text,
    includedSources: kept.map((item) => item.section.source),
    dropped,
    isTruncated,
    bytes: byteLength(text),
  };
}
