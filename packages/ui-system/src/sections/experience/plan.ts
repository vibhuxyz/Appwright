import { effectById, type EffectEntry } from "../../patterns";
import { sectionById } from "../catalog";
import type { PageCompositionPlan } from "../compose";
import { SIGNATURE_IDEAS, SUPPORTING_EFFECTS } from "./ideas";
import { imageTreatmentFor } from "./image-treatments";
import { hashSeed } from "./seed";
import type { ExperienceInput, ExperienceStrategy, SectionMotion, SignatureIdea } from "./types";

const MAX_SUPPORTING_EFFECTS = 2;
const SAME_AS_DESKTOP = "Same as desktop";
const BASE_MOBILE = [
  "Below md, drag stages, pinned scenes and pointer effects use their documented fallback; nothing depends on hover.",
  "Every tap target is at least 24px (primary actions 44px or more) and no text sits under a moving element.",
];
const BASE_PERFORMANCE = [
  "Animate transform, opacity and clip-path only.",
  "Continuous effects stop off screen and in background tabs; at most one runs at a time.",
  "The hero image loads with priority; every other image is lazy.",
];

interface ChosenSignature {
  readonly idea: SignatureIdea;
  readonly sectionId: string;
  readonly effect: EffectEntry;
}

function signatureCandidates(plan: PageCompositionPlan, briefText: string): ChosenSignature[] {
  const sectionIds = plan.sections.map((section) => section.sectionId);
  return SIGNATURE_IDEAS.flatMap((idea) => {
    if (idea.direction !== plan.artDirection || (idea.signal && !idea.signal.test(briefText))) return [];
    const sectionId = sectionIds.find((id) => idea.hostSectionIds.includes(id));
    const effect = effectById(idea.effectId);
    return sectionId && effect ? [{ idea, sectionId, effect }] : [];
  });
}

function chooseSignature(plan: PageCompositionPlan, input: ExperienceInput): ChosenSignature | null {
  const candidates = signatureCandidates(plan, input.briefText);
  const briefMatches = candidates.filter((candidate) => candidate.idea.signal !== undefined);
  const pool = briefMatches.length > 0 ? briefMatches : candidates;
  return pool[hashSeed(input.seed) % pool.length] ?? null;
}

function motionFor(plan: PageCompositionPlan, signature: ChosenSignature | null): SectionMotion[] {
  return plan.sections.map((section) => {
    if (signature?.sectionId === section.sectionId) return { sectionId: section.sectionId, level: signature.effect.level };
    if (section.density === "high") return { sectionId: section.sectionId, level: "none" };
    return { sectionId: section.sectionId, level: "reveal" };
  });
}

function imageRoles(plan: PageCompositionPlan): string[] {
  const roles = plan.sections.flatMap((section) => (sectionById(section.sectionId)?.assets ?? []).map((asset) => asset.purpose));
  return [...new Set(roles)].sort();
}

export function planExperience(plan: PageCompositionPlan, input: ExperienceInput): ExperienceStrategy {
  const signature = chooseSignature(plan, input);
  const supportingEffectIds = (signature ? (SUPPORTING_EFFECTS[plan.artDirection] ?? []) : [])
    .filter((id) => id !== signature?.effect.id && effectById(id) !== undefined)
    .slice(0, MAX_SUPPORTING_EFFECTS);
  const effects = [signature?.effect, ...supportingEffectIds.map(effectById)].flatMap((effect) => (effect ? [effect] : []));
  return {
    signature: signature ? { idea: signature.idea.idea, effectId: signature.effect.id, sectionId: signature.sectionId } : null,
    supportingEffectIds,
    sectionMotion: motionFor(plan, signature),
    imageTreatments: imageRoles(plan).map((role) => imageTreatmentFor(role, plan.artDirection)),
    mobile: [...BASE_MOBILE, ...effects.filter((effect) => !effect.touch.startsWith(SAME_AS_DESKTOP)).map((effect) => `${effect.exportName}: ${effect.touch}`)],
    performance: [...BASE_PERFORMANCE, ...effects.filter((effect) => effect.performance !== "light").map((effect) => `${effect.exportName} is ${effect.performance} cost: one instance, only in its section.`)],
  };
}

export function experienceEffectIds(strategy: ExperienceStrategy): string[] {
  return [...(strategy.signature ? [strategy.signature.effectId] : []), ...strategy.supportingEffectIds];
}
