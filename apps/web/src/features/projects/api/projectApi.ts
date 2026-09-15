import { httpClient } from "@/shared/lib/httpClient";
import { projectSchema } from "../schemas/projectSchemas";
import { z } from "zod";

export const projectApi = {
  list: (signal?: AbortSignal) =>
    httpClient.get("/projects", signal).then((r) => z.array(projectSchema).parse(r)),
  get: (id: string, signal?: AbortSignal) =>
    httpClient.get(`/project/${id}`, signal).then(projectSchema.parse),
  create: (name: string, templateId: string) =>
    httpClient
      .post("/project", { name, templateId })
      .then(projectSchema.parse),
  remove: (id: string) => httpClient.delete(`/project/${id}`),
};
