import { UnsplashPhoto } from "@repo/contracts";
import z from "zod";
import { MAX_DESCRIPTION_CHARS, UNSPLASH_REFERRAL } from "./constants";

const NullableText = z.string().nullable().optional();

const RawPhoto = z.object({
  id: z.string(),
  description: NullableText,
  alt_description: NullableText,
  width: z.number(),
  height: z.number(),
  urls: z.object({ small: z.string(), regular: z.string() }),
  user: z.object({ name: z.string(), links: z.object({ html: z.string() }) }),
  links: z.object({ html: z.string(), download_location: z.string() }),
});

export const RawSearchResponse = z.object({
  total: z.number(),
  total_pages: z.number(),
  results: z.array(z.unknown()),
});

export function withReferral(link: string): string {
  const url = URL.parse(link);
  if (!url) return link;
  url.searchParams.set("utm_source", UNSPLASH_REFERRAL.source);
  url.searchParams.set("utm_medium", UNSPLASH_REFERRAL.medium);
  return url.toString();
}

function describe(raw: z.infer<typeof RawPhoto>): string | null {
  const text = (raw.description || raw.alt_description || "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, MAX_DESCRIPTION_CHARS) : null;
}

export function normalizePhoto(raw: unknown): UnsplashPhoto | null {
  const parsedRaw = RawPhoto.safeParse(raw);
  if (!parsedRaw.success) return null;
  const photo = parsedRaw.data;
  const normalized = UnsplashPhoto.safeParse({
    id: photo.id,
    description: describe(photo),
    width: photo.width,
    height: photo.height,
    smallUrl: photo.urls.small,
    regularUrl: photo.urls.regular,
    downloadLocation: photo.links.download_location,
    attribution: {
      photographerName: photo.user.name,
      photographerUrl: withReferral(photo.user.links.html),
      photoUrl: withReferral(photo.links.html),
    },
  });
  return normalized.success ? normalized.data : null;
}

export function normalizePhotos(results: readonly unknown[]): { photos: UnsplashPhoto[]; skipped: number } {
  const photos = results.flatMap((raw) => {
    const photo = normalizePhoto(raw);
    return photo ? [photo] : [];
  });
  return { photos, skipped: results.length - photos.length };
}
