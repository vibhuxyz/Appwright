const HEX = /^#[0-9a-fA-F]{6}$/;

function linearChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

export function contrastRatio(first: string, second: string): number | undefined {
  if (!isHexColor(first) || !isHexColor(second)) return undefined;
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastPass(ratio: number | undefined): "aa" | "large" | "fail" | "not-checked" {
  if (ratio === undefined) return "not-checked";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "large";
  return "fail";
}
