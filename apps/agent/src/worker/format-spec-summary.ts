import type { ProjectSpecification } from "@repo/contracts";

export function formatSpecificationSummary(spec: ProjectSpecification): string {
  const evidenceLines = spec.sourceEvidence
    .map((e) => `  - **${e.sourceName}** (${e.role}): ${e.description}`)
    .join("\n");
  const pageNames = spec.pages.map((p) => `${p.name} (\`${p.route}\`)`).join(", ");

  const sections: string[] = [
    `I've analyzed your request and reference material:`,
    ``,
    `• **Intent**: ${spec.projectIntent.summary}`,
    `• **Visual Direction**: ${spec.designSystem.visualDirection}`,
  ];

  if (evidenceLines) {
    sections.push(`• **References Applied**:\n${evidenceLines}`);
  }
  sections.push(`• **Pages Planned**: ${pageNames}`);
  if (spec.assumptions.length > 0) {
    sections.push(`• **Key Assumptions**: ${spec.assumptions.join("; ")}`);
  }

  return sections.join("\n");
}
