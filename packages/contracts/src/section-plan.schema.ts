import z from "zod";

export const SECTION_PLAN_LIMITS = {
  maxSectionsPerPage: 8,
  maxReasonChars: 180,
  maxFieldChars: 48,
  maxFields: 8,
  maxInteractions: 4,
  maxResponsiveChars: 180,
} as const;

export const SectionPurpose = z.enum([
  "navigation",
  "hero",
  "brand",
  "features",
  "product-showcase",
  "categories",
  "gallery",
  "portfolio",
  "story",
  "testimonials",
  "pricing",
  "faq",
  "contact",
  "location",
  "newsletter",
  "cta",
  "footer",
  "dashboard-metrics",
  "data-table",
  "form",
]);
export type SectionPurpose = z.infer<typeof SectionPurpose>;

export const SectionSurface = z.enum(["canvas", "muted", "inverse", "image"]);
export type SectionSurface = z.infer<typeof SectionSurface>;

export const SectionWidth = z.enum(["full", "content", "narrow"]);
export type SectionWidth = z.infer<typeof SectionWidth>;

export const PlannedSectionSchema = z.object({
  sectionId: z.string().min(1).max(80),
  variantId: z.string().min(1).max(40),
  purpose: SectionPurpose,
  reason: z.string().min(1).max(SECTION_PLAN_LIMITS.maxReasonChars),
  layoutPattern: z.string().min(1).max(40),
  surface: SectionSurface,
  width: SectionWidth,
  spacing: z.enum(["compact", "comfortable", "spacious"]),
  imageAspect: z.string().max(16).optional(),
  assetPurposes: z.array(z.string().min(1).max(24)).max(4),
  contentFields: z.array(z.string().min(1).max(SECTION_PLAN_LIMITS.maxFieldChars)).max(SECTION_PLAN_LIMITS.maxFields),
  interactions: z.array(z.string().min(1).max(80)).max(SECTION_PLAN_LIMITS.maxInteractions),
  responsive: z.string().min(1).max(SECTION_PLAN_LIMITS.maxResponsiveChars),
});
export type PlannedSection = z.infer<typeof PlannedSectionSchema>;
