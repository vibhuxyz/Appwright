import type { UnsplashOrientation } from "@repo/contracts";

export const assetKeys = {
  requests: (sessionId: string) => ["assets", "requests", sessionId] as const,
  project: (projectId: string) => ["assets", "project", projectId] as const,
  photoSearch: (query: string, orientation: UnsplashOrientation | undefined) =>
    ["assets", "photo-search", query, orientation ?? "any"] as const,
};
