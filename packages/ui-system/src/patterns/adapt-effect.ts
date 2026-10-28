import type { VendoredEffect } from "./types";

const USE_CLIENT_DIRECTIVE = /^\s*["']use client["'];?[ \t]*\r?\n+/;
const MOTION_IMPORT = /(["'])motion\/react\1/g;
const SHADCN_UTILS_IMPORT = /(["'])@\/lib\/utils\1/g;

function applyPatch(
  content: string,
  [from, to]: readonly [string, string],
  effect: VendoredEffect,
): string {
  if (!content.includes(from))
    throw new Error(`Patch for effect ${effect.id} no longer matches: ${from}`);
  return content.replace(from, to);
}

export function adaptEffectSource(
  content: string,
  effect: VendoredEffect,
): string {
  const base = content
    .replace(USE_CLIENT_DIRECTIVE, "")
    .replace(MOTION_IMPORT, '"framer-motion"')
    .replace(SHADCN_UTILS_IMPORT, '"@/components/ui/utils"');
  return (effect.vendor.patches ?? []).reduce(
    (text, patch) => applyPatch(text, patch, effect),
    base,
  );
}

export function effectBanner(effect: VendoredEffect): string {
  return `/* VENDORED from ${effect.vendor.url} (${effect.vendor.sourceId}). Regenerate: bun --filter @repo/ui-system vendor:effects */\n`;
}
