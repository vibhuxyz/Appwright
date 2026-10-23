const HEX = /^#[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function linearChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex);
  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

export function isHex(value: string): boolean {
  return HEX.test(value);
}

export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((left, right) => right - left) as [
    number,
    number,
  ];
  return (lighter + 0.05) / (darker + 0.05);
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(1)}:1`;
}

export function contrastUse(ratio: number): { use: string; pass: "aa" | "large" | "fail" } {
  if (ratio >= 4.5) return { use: "body + display", pass: "aa" };
  if (ratio >= 3) return { use: "large text only (≥24px bold)", pass: "large" };
  return { use: "fails — use a darker or lighter pair", pass: "fail" };
}

export function readableOn(background: string): string {
  return contrastRatio("#fafafa", background) >= contrastRatio("#111111", background) ? "#fafafa" : "#111111";
}

export function hexToHsl(hex: string): { hue: number; saturation: number; lightness: number } {
  const [red, green, blue] = hexToRgb(hex).map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness: lightness * 100 };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hueByMax =
    max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return { hue: (hueByMax * 60 + 360) % 360, saturation: saturation * 100, lightness: lightness * 100 };
}

function channelToHex(channel: number): string {
  return Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, "0");
}

export function hslToHex(hue: number, saturation: number, lightness: number): string {
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
