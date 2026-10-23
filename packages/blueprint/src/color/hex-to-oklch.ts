function srgbChannelToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function parseHexChannel(hex: string, offset: number): number {
  return Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
}

export function hexToOklch(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = srgbChannelToLinear(parseHexChannel(normalized, 0));
  const g = srgbChannelToLinear(parseHexChannel(normalized, 2));
  const b = srgbChannelToLinear(parseHexChannel(normalized, 4));

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l2 = Math.cbrt(l);
  const m2 = Math.cbrt(m);
  const s2 = Math.cbrt(s);

  const lightness = 0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2;
  const a = 1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2;
  const bChannel = 0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2;

  const chroma = Math.sqrt(a * a + bChannel * bChannel);
  const hueRadians = Math.atan2(bChannel, a);
  const hueDegrees = (hueRadians * 180) / Math.PI;
  const hue = hueDegrees < 0 ? hueDegrees + 360 : hueDegrees;

  return `oklch(${lightness.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(1)})`;
}
