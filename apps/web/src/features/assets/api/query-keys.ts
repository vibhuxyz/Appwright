export const assetKeys = {
  requests: (sessionId: string) => ["assets", "requests", sessionId] as const,
  project: (projectId: string) => ["assets", "project", projectId] as const,
};
