import { ProjectType, type Intent } from "@repo/contracts";
import { PROJECT_TYPE_KEYWORDS } from "./constants";

function matchKeywords(text: string): ProjectType | undefined {
  return PROJECT_TYPE_KEYWORDS.find(([, pattern]) => pattern.test(text))?.[0];
}

export function normalizeProjectType(intent: Intent, prompt: string): ProjectType {
  const declared = ProjectType.safeParse(intent.projectType);
  if (declared.success && declared.data !== "other") return declared.data;
  const labelled = matchKeywords(`${intent.domain} ${intent.type}`);
  return labelled ?? matchKeywords(prompt) ?? "other";
}
