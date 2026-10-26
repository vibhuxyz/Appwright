import { httpClient } from "@/shared/lib/httpClient";
import { projectSchema } from "../schemas/projectSchemas";
import { z } from "zod";
import type { CreateProjectRequest } from "@repo/contracts";

export const projectApi = {
  list: (signal?: AbortSignal) =>
    httpClient.get("/projects", signal).then((r) => z.array(projectSchema).parse(r)),
  get: (id: string, signal?: AbortSignal) =>
    httpClient.get(`/project/${id}`, signal).then(projectSchema.parse),
  create: (input: CreateProjectRequest) =>
    httpClient
      .post("/project", input)
      .then(projectSchema.parse),
  remove: (id: string) => httpClient.delete(`/project/${id}`),
};
