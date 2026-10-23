import { RequirementSchema } from "@repo/contracts";
import { z } from "zod";

const RequirementsSchema = z.array(RequirementSchema);

export function acceptanceFor(taskType: string, rawRequirements: unknown): string[] {
  const parsed = RequirementsSchema.safeParse(rawRequirements);
  if (!parsed.success) return [];
  const area = taskType.toLowerCase();
  return parsed.data
    .filter((requirement) => requirement.area === area && requirement.level === "required")
    .flatMap((requirement) => requirement.acceptance);
}
