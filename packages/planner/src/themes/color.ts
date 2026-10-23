export interface Hsl {
  hue: number;
  saturation: number;
  lightness: number;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MIN_TEXT_CONTRAST = 4.5;
const NEAR_WHITE = "#fafafa";
const NEAR_BLACK = "#111111";
const CONTRAST_STEP = 0.03;
const MAX_CONTRAST_STEPS = 40;

export function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_PATTERN.test(value);
}

function channelToHex(channel: number): string {
  return Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, "0");
}

export function hslToHex({ hue, saturation, lightness }: Hsl): string {
  const s = Math.min(100, Math.max(0, saturation)) / 100;
  const l = Math.min(100, Math.max(0, lightness)) / 100;
  const h = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const channel = (offset: number) => {
    const k = (offset + h / 30) % 12;
    return l - (chroma / 2) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return `#${channelToHex(channel(0))}${channelToHex(channel(8))}${channelToHex(channel(4))}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function hexToHsl(hex: string): Hsl {
  const [red, green, blue] = hexToRgb(hex).map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness: lightness * 100 };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hueByMax = max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return { hue: (hueByMax * 60 + 360) % 360, saturation: saturation * 100, lightness: lightness * 100 };
}

function linearChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex);
  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableOn(background: string): string {
  return contrastRatio(NEAR_WHITE, background) >= contrastRatio(NEAR_BLACK, background) ? NEAR_WHITE : NEAR_BLACK;
}

export function ensureContrast(foreground: string, background: string, minimum = MIN_TEXT_CONTRAST): string {
  if (contrastRatio(foreground, background) >= minimum) return foreground;
  const base = hexToHsl(foreground);
  const direction = luminance(background) > 0.4 ? -1 : 1;
  for (let step = 1; step <= MAX_CONTRAST_STEPS; step++) {
    const candidate = hslToHex({ ...base, lightness: base.lightness + direction * step * CONTRAST_STEP * 100 });
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  return readableOn(background);
}

export function fitFillToText(fill: string): string {
  const text = readableOn(fill);
  if (contrastRatio(text, fill) >= MIN_TEXT_CONTRAST) return fill;
  const base = hexToHsl(fill);
  const direction = text === NEAR_WHITE ? -1 : 1;
  for (let step = 1; step <= MAX_CONTRAST_STEPS; step++) {
    const candidate = hslToHex({ ...base, lightness: base.lightness + direction * step * CONTRAST_STEP * 100 });
    if (contrastRatio(readableOn(candidate), candidate) >= MIN_TEXT_CONTRAST) return candidate;
  }
  return fill;
}
