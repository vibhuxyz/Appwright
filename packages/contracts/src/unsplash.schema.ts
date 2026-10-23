import z from "zod";

export const UNSPLASH_LIMITS = {
  maxQueryChars: 120,
  maxPage: 50,
  maxPerPage: 30,
  defaultPerPage: 12,
} as const;

export const UNSPLASH_IMAGE_HOST = "images.unsplash.com";
export const UNSPLASH_SITE_HOST = "unsplash.com";
export const UNSPLASH_API_HOST = "api.unsplash.com";

export const UnsplashOrientation = z.enum(["landscape", "portrait", "squarish"]);
export type UnsplashOrientation = z.infer<typeof UnsplashOrientation>;

export const UnsplashContentFilter = z.enum(["low", "high"]);
export type UnsplashContentFilter = z.infer<typeof UnsplashContentFilter>;

export const UnsplashColor = z.enum([
  "black_and_white",
  "black",
  "white",
  "yellow",
  "orange",
  "red",
  "purple",
  "magenta",
  "green",
  "teal",
  "blue",
]);
export type UnsplashColor = z.infer<typeof UnsplashColor>;

function urlOnHost(host: string) {
  return z
    .string()
    .url()
    .refine((value) => {
      const parsed = URL.parse(value);
      return parsed?.protocol === "https:" && (parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
    }, `must be an https URL on ${host}`);
}

export const UnsplashSearchQuery = z.object({
  query: z.string().trim().min(1).max(UNSPLASH_LIMITS.maxQueryChars),
  page: z.coerce.number().int().min(1).max(UNSPLASH_LIMITS.maxPage).default(1),
  perPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(UNSPLASH_LIMITS.maxPerPage)
    .default(UNSPLASH_LIMITS.defaultPerPage),
  orientation: UnsplashOrientation.optional(),
  contentFilter: UnsplashContentFilter.default("high"),
  color: UnsplashColor.optional(),
});
export type UnsplashSearchQuery = z.infer<typeof UnsplashSearchQuery>;

export const UnsplashAttribution = z.object({
  photographerName: z.string().min(1).max(200),
  photographerUrl: urlOnHost(UNSPLASH_SITE_HOST),
  photoUrl: urlOnHost(UNSPLASH_SITE_HOST),
});
export type UnsplashAttribution = z.infer<typeof UnsplashAttribution>;

export const UnsplashPhoto = z.object({
  id: z.string().min(1).max(64),
  description: z.string().max(500).nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  smallUrl: urlOnHost(UNSPLASH_IMAGE_HOST),
  regularUrl: urlOnHost(UNSPLASH_IMAGE_HOST),
  downloadLocation: urlOnHost(UNSPLASH_API_HOST),
  attribution: UnsplashAttribution,
});
export type UnsplashPhoto = z.infer<typeof UnsplashPhoto>;

export const UnsplashSearchResponse = z.object({
  items: z.array(UnsplashPhoto),
  page: z.number().int().min(1),
  perPage: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
export type UnsplashSearchResponse = z.infer<typeof UnsplashSearchResponse>;

export const SelectUnsplashPhotoRequest = z.object({ photo: UnsplashPhoto });
export type SelectUnsplashPhotoRequest = z.infer<typeof SelectUnsplashPhotoRequest>;
