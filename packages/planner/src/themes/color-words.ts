const COLOR_WORD_HUES: ReadonlyArray<readonly [RegExp, number]> = [
  [/\b(red|crimson|ruby)\b/i, 2],
  [/\b(orange|tangerine|amber)\b/i, 25],
  [/\b(gold|yellow|mustard|lemon)\b/i, 48],
  [/\b(lime|olive)\b/i, 80],
  [/\b(green|emerald|sage|forest|mint)\b/i, 145],
  [/\b(teal|turquoise|aqua)\b/i, 178],
  [/\b(blue|navy|ocean|sky)\b/i, 215],
  [/\b(indigo)\b/i, 252],
  [/\b(purple|violet|lavender|plum)\b/i, 280],
  [/\b(pink|rose|blush|magenta)\b/i, 335],
  [/\b(brown|chocolate|coffee|terracotta|rust)\b/i, 22],
];

const DARK_WORDS = /\b(dark|black|night|midnight|moody)\b/i;
const MAX_HINT_HUES = 3;

export function hueHints(description: string): number[] {
  return COLOR_WORD_HUES.filter(([pattern]) => pattern.test(description))
    .map(([, hue]) => hue)
    .slice(0, MAX_HINT_HUES);
}

export function wantsDark(description: string): boolean {
  return DARK_WORDS.test(description);
}
