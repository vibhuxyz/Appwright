import { httpClient } from "@/shared/lib/httpClient";
import { deploymentSchema, vercelStatusSchema } from "../schemas/deploymentSchemas";

export const deploymentApi = {
  // Connection status is per user, not per project — one connect covers
  // every app they ever create.
  getVercelStatus: () =>
    httpClient.get("/vercel/status").then(vercelStatusSchema.parse),
  // A POST that returns the URL, rather than an <a href> to a redirect: a
  // top-level navigation carries no Authorization header, so the server
  // would not know which user is connecting.
  startVercelConnect: (projectId: string) =>
    httpClient.post<{ url: string }>(`/project/${projectId}/vercel/connect`),
  disconnectVercel: () => httpClient.delete("/vercel/connection"),
  deploy: (projectId: string) =>
    httpClient
      .post(`/project/${projectId}/deploy`)
      .then(deploymentSchema.parse),
  getDeployment: (projectId: string, deploymentId: string) =>
    httpClient
      .get(`/project/${projectId}/deployment/${deploymentId}`)
      .then(deploymentSchema.parse),
};
