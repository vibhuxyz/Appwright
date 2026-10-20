import z from "zod";

export const BuildBlueprintRequest = z.object({
  prompt: z.string().trim().min(1),
  // Slice 3b — the id of a design direction chosen in the design review
  // step. Omitted means "use the default direction."
  directionId: z.string().min(1).optional(),
});

export const BuildBlueprintTaskResponse = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  dependsOn: z.array(z.string()),
});

export const BuildBlueprintResponse = z.object({
  blueprintId: z.string(),
  blueprintVersion: z.number().int(),
  runId: z.string(),
  tasks: z.array(BuildBlueprintTaskResponse),
  assetRequestId: z.string().nullable(),
});

export const LatestBlueprintRunResponse = z.object({
  blueprintId: z.string(),
  runId: z.string(),
});

export type BuildBlueprintRequest = z.infer<typeof BuildBlueprintRequest>;
export type BuildBlueprintTaskResponse = z.infer<typeof BuildBlueprintTaskResponse>;
export type BuildBlueprintResponse = z.infer<typeof BuildBlueprintResponse>;
export type LatestBlueprintRunResponse = z.infer<typeof LatestBlueprintRunResponse>;
