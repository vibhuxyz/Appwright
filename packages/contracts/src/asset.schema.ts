import z from "zod";

export const AssetPurpose = z.enum([
  "hero",
  "banner",
  "avatar",
  "gallery",
  "logo",
  "background",
  "icon",
  "photo",
  "other",
]);
export type AssetPurpose = z.infer<typeof AssetPurpose>;

export const AssetSlotStatus = z.enum([
  "PENDING",
  "UPLOADING",
  "GENERATING",
  "RESOLVED",
  "SKIPPED",
]);
export type AssetSlotStatus = z.infer<typeof AssetSlotStatus>;

export const AssetSlotSchema = z.object({
  id: z.string().min(1),
  pageRoute: z.string().min(1),
  componentName: z.string().min(1),
  purpose: AssetPurpose,
  altText: z.string().min(1).max(160),
  suggestedPrompt: z.string().min(1).max(500),
  status: AssetSlotStatus,
  assetId: z.string().nullable().optional(),
});
export type AssetSlot = z.infer<typeof AssetSlotSchema>;

export const AssetRequestStatus = z.enum(["PENDING", "RESOLVED"]);
export type AssetRequestStatus = z.infer<typeof AssetRequestStatus>;

export const AssetRequestResponse = z.object({
  id: z.string(),
  sessionId: z.string(),
  blueprintId: z.string(),
  slots: z.array(AssetSlotSchema),
  status: AssetRequestStatus,
  createdAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});
export type AssetRequestResponse = z.infer<typeof AssetRequestResponse>;

export const GenerateAssetRequest = z.object({
  prompt: z.string().trim().min(1).max(500),
});
export type GenerateAssetRequest = z.infer<typeof GenerateAssetRequest>;

export const AssetSource = z.enum(["UPLOADED", "GENERATED"]);
export type AssetSource = z.infer<typeof AssetSource>;

export const ProjectAssetResponse = z.object({
  id: z.string(),
  projectId: z.string(),
  sessionId: z.string(),
  purpose: AssetPurpose,
  source: AssetSource,
  prompt: z.string().nullable().optional(),
  url: z.string(),
  localPath: z.string(),
  altText: z.string(),
  createdAt: z.string(),
});
export type ProjectAssetResponse = z.infer<typeof ProjectAssetResponse>;

export const ListProjectAssetsResponse = z.object({
  items: z.array(ProjectAssetResponse),
  nextCursor: z.string().nullable(),
});
export type ListProjectAssetsResponse = z.infer<typeof ListProjectAssetsResponse>;
