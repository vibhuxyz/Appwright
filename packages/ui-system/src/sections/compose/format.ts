import { transitionNote } from "./constraints";
import type { PageCompositionPlan } from "./types";

const CLOSING_TAG = "</page-goal>";

export function formatComposition(plan: PageCompositionPlan): string[] {
  const { visualStrategy: strategy } = plan;
  return [
    `Page composition plan (decided in code before you write JSX; follow it):`,
    `Art direction ${plan.artDirection}. Density ${strategy.density}, images ${strategy.imageTreatment}, type ${strategy.typographyStyle}, motion ${strategy.motionLevel}.`,
    `<page-goal>${plan.pageGoal.replaceAll(CLOSING_TAG, "<\\/page-goal>")}</page-goal>`,
    ...plan.sections.map((section, index) => `${index + 1}. ${section.sectionId} (${section.visualRole}, ${section.density} density): ${transitionNote(section, plan.sections[index - 1])}`),
    ...plan.constraints.map((constraint) => `- ${constraint}`),
  ];
}
