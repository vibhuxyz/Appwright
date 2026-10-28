import type { MotionLevel } from "../../patterns";
import { MAX_EXPRESSIVE_SECTIONS } from "./constants";
import type { ComposedSection, VisualStrategy } from "./types";

const DENSE_TO_SPACIOUS = "Switch from dense discovery to a spacious layout here; do not repeat the hero's composition.";

export function transitionNote(section: ComposedSection, previous: ComposedSection | undefined): string {
  if (!previous) return "Opens the page.";
  if (previous.density === "high" && section.density === "low") return DENSE_TO_SPACIOUS;
  if (previous.density === section.density) return `Same ${section.density} density as ${previous.sectionId}; change scale, alignment or surface.`;
  return `Moves from ${previous.density} to ${section.density} density.`;
}

export function compositionConstraints(
  sections: readonly ComposedSection[],
  motions: readonly MotionLevel[],
  strategy: VisualStrategy,
): string[] {
  const anchor = sections.find((section) => section.visualRole === "anchor");
  const conversion = sections.filter((section) => section.visualRole === "conversion").at(-1);
  const expressive = sections.filter((_, index) => motions[index] === "expressive").map((section) => section.sectionId);
  const constraints = [
    anchor ? `${anchor.sectionId} is the one focal point; every other section is visually quieter.` : "No section is the focal point; keep every section equally calm.",
    "Use the primary colour for one action per screen.",
    expressive.length > 0
      ? `Expressive motion only in ${expressive.slice(0, MAX_EXPRESSIVE_SECTIONS).join(" and ")}; other sections use Reveal or no motion.`
      : `Motion stays ${strategy.motionLevel}: Reveal on scroll at most.`,
    "One image ratio inside each grid, rail or gallery.",
  ];
  if (strategy.imageTreatment === "product") constraints.push("Product images are clean cut-outs or studio shots on one background; campaign photography stays in the hero and story.");
  if (strategy.imageTreatment === "editorial") constraints.push("Images are large and uncropped in meaning; captions are small uppercase labels.");
  if (conversion) constraints.push(`${conversion.sectionId} completes the journey; nothing after it but the footer.`);
  return constraints;
}
