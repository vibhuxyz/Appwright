const CHANNEL_SHIFT = 4;
const BUCKET_CENTER = 8;
const MIN_ALPHA = 128;
const MIN_LIGHTNESS = 0.08;
const MAX_LIGHTNESS = 0.94;
const MIN_COLOR_DISTANCE = 48;
const PIXEL_STRIDE = 4;

interface Bucket {
  red: number;
  green: number;
  blue: number;
  weight: number;
}

function channelHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function toHex({ red, green, blue }: Bucket): string {
  return `#${channelHex(red)}${channelHex(green)}${channelHex(blue)}`;
}

function distance(first: Bucket, second: Bucket): number {
  return Math.hypot(first.red - second.red, first.green - second.green, first.blue - second.blue);
}

function vividness(red: number, green: number, blue: number): number {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max === 0 ? 0 : (max - min) / max;
}

function lightnessOf(red: number, green: number, blue: number): number {
  return (Math.max(red, green, blue) + Math.min(red, green, blue)) / 510;
}

function collectBuckets(pixels: Uint8ClampedArray): Map<number, Bucket> {
  const buckets = new Map<number, Bucket>();
  for (let offset = 0; offset + 3 < pixels.length; offset += PIXEL_STRIDE) {
    const red = pixels[offset] ?? 0;
    const green = pixels[offset + 1] ?? 0;
    const blue = pixels[offset + 2] ?? 0;
    const alpha = pixels[offset + 3] ?? 0;
    const lightness = lightnessOf(red, green, blue);
    if (alpha < MIN_ALPHA || lightness < MIN_LIGHTNESS || lightness > MAX_LIGHTNESS) continue;
    const key = ((red >> CHANNEL_SHIFT) << 8) | ((green >> CHANNEL_SHIFT) << 4) | (blue >> CHANNEL_SHIFT);
    const weight = 1 + vividness(red, green, blue) * 2;
    const bucket = buckets.get(key) ?? {
      red: ((red >> CHANNEL_SHIFT) << CHANNEL_SHIFT) + BUCKET_CENTER,
      green: ((green >> CHANNEL_SHIFT) << CHANNEL_SHIFT) + BUCKET_CENTER,
      blue: ((blue >> CHANNEL_SHIFT) << CHANNEL_SHIFT) + BUCKET_CENTER,
      weight: 0,
    };
    bucket.weight += weight;
    buckets.set(key, bucket);
  }
  return buckets;
}

export function dominantColors(pixels: Uint8ClampedArray, limit: number): string[] {
  const ranked = [...collectBuckets(pixels).values()].sort((left, right) => right.weight - left.weight);
  const chosen: Bucket[] = [];
  for (const bucket of ranked) {
    if (chosen.length === limit) break;
    if (chosen.every((existing) => distance(existing, bucket) >= MIN_COLOR_DISTANCE)) chosen.push(bucket);
  }
  return chosen.map(toHex);
}
