import type { BlueprintContent } from "@repo/planner";
import type { Entity, Page, ProjectSpecification } from "@repo/contracts";

export function specificationToBlueprintContent(
  spec: ProjectSpecification,
): BlueprintContent {
  const entities: Entity[] = spec.dataModel.map((item) => ({
    name: item.entity,
    fields: item.fields.map((f) => ({
      name: f.name,
      type: (f.type as "String" | "Int" | "Boolean" | "DateTime" | "Json") || "String",
      required: f.required ?? true,
      unique: f.unique ?? false,
    })),
    relations: item.relations ?? [],
  }));

  const pages: Page[] = spec.pages.map((p) => ({
    route: p.route.startsWith("/") ? p.route : `/${p.route}`,
    purpose: p.purpose,
    components: p.requiredComponents ?? [],
  }));

  const features: string[] = [];
  const reqTokens = [
    ...spec.requirements.functional,
    ...spec.requirements.businessRules,
    ...spec.integrations.map((i) => i.name),
  ].map((r) => r.toLowerCase());

  if (reqTokens.some((r) => r.includes("auth") || r.includes("login") || r.includes("user account"))) {
    features.push("auth");
  }
  if (reqTokens.some((r) => r.includes("stripe") || r.includes("payment") || r.includes("checkout"))) {
    features.push("payments");
  }

  const primaryColor =
    spec.designSystem.colors.find((c) => c.role === "primary")?.hex || "#111827";
  const theme = {
    preset: spec.designSystem.visualDirection || "default",
    primary: primaryColor,
  };

  return { entities, pages, features, theme };
}
