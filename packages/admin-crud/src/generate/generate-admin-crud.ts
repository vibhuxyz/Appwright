import type { Entity } from "@repo/contracts";
import { generateAdminApiRoutes } from "./generate-api-route";
import { generateAdminView } from "./generate-admin-page";
import type { GeneratedFile } from "./types";

export function generateAdminCrud(entity: Entity): GeneratedFile[] {
  return [generateAdminView(entity), ...generateAdminApiRoutes(entity)];
}
