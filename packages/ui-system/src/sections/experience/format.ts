import { effectById, patternImportPath } from "../../patterns";
import type { ExperienceStrategy } from "./types";

function effectLine(effectId: string, role: string): string | null {
  const effect = effectById(effectId);
  if (!effect) return null;
  return `- ${role}: import { ${effect.exportName} } from "${patternImportPath(effect.file)}". ${effect.purpose} Options: ${effect.options} Reduced motion: ${effect.reducedMotion}`;
}

export function formatExperience(strategy: ExperienceStrategy): string[] {
  const signature = strategy.signature;
  if (!signature && strategy.imageTreatments.length === 0) return [];
  const lines = ["Experience strategy (one signature moment; everything else stays calm):"];
  if (signature) {
    lines.push(`Signature idea in ${signature.sectionId}: ${signature.idea} Make it specific to this business; adapt it, do not add a second one.`);
    const line = effectLine(signature.effectId, "Signature effect");
    if (line) lines.push(line);
  } else {
    lines.push("No signature effect: let typography, imagery and spacing carry the page.");
  }
  for (const id of strategy.supportingEffectIds) {
    const line = effectLine(id, "Optional support");
    if (line) lines.push(line);
  }
  lines.push(`Motion per section: ${strategy.sectionMotion.map((entry) => `${entry.sectionId} ${entry.level}`).join(", ")}. "none" adds nothing beyond the pattern; "reveal" uses Reveal or a Media entrance.`);
  if (strategy.imageTreatments.length > 0) {
    lines.push(`Image treatments (one primary treatment per image, set on Media): ${strategy.imageTreatments.map((treatment) => `${treatment.role} entrance=${treatment.entrance} hover=${treatment.hover}${treatment.scroll === "parallax" ? " inside Parallax" : ""}`).join("; ")}. Set focalPoint when the subject is off centre.`);
  }
  lines.push(...strategy.mobile.map((rule) => `- Mobile: ${rule}`));
  lines.push(...strategy.performance.map((rule) => `- Performance: ${rule}`));
  return lines;
}
