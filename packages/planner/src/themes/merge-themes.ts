import { THEME_OPTION_COUNT, type ThemeOption } from "@repo/contracts";

export function mergeThemes(generated: readonly ThemeOption[], presets: readonly ThemeOption[]): ThemeOption[] {
  const merged: ThemeOption[] = [];
  const usedIds = new Set<string>();
  for (const theme of [...generated, ...presets]) {
    if (merged.length === THEME_OPTION_COUNT) break;
    const id = usedIds.has(theme.id) ? `${theme.id}-preset` : theme.id;
    if (usedIds.has(id)) continue;
    usedIds.add(id);
    merged.push({ ...theme, id });
  }
  return merged;
}
