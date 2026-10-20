import { httpClient } from "@/shared/lib/httpClient";
import {
  componentGraphSchema,
  compileResultSchema,
  submitResultSchema,
  type ChangeSetInput,
} from "../schemas/editor-schemas";

export const editorApi = {
  getComponents: (projectId: string, signal?: AbortSignal) =>
    httpClient
      .get(`/v1/projects/${projectId}/components`, signal)
      .then(componentGraphSchema.parse)
      .then((body) => body.components),
  compileChangeSet: (projectId: string, input: ChangeSetInput, signal?: AbortSignal) =>
    httpClient
      .post(`/v1/projects/${projectId}/changesets/compile`, input, signal)
      .then(compileResultSchema.parse),
  submitChangeSet: (projectId: string, input: ChangeSetInput, signal?: AbortSignal) =>
    httpClient
      .post(`/v1/projects/${projectId}/changesets`, input, signal)
      .then(submitResultSchema.parse),
};
