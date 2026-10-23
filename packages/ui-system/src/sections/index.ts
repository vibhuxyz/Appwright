export { SECTION_CATALOG, sectionById } from "./catalog";
export { FIXTURES, measureFixture, measureFixtures } from "./fixtures";
export type { FixturePageResult, FixtureResult } from "./fixtures";
export { EMPTY_SECTION_FILTER, filterSections, applyReview, parseReviews } from "./preview";
export type { SectionFilter, SectionReview } from "./preview";
export {
  GENERATED_STACK,
  SOURCE_DECISIONS,
  ingestionAllowed,
  isStackCompatible,
  sourceAllowsIngestion,
  sourceById,
} from "./registry";
export type { QualityCheck, SectionEntry, SourceDecision } from "./registry";
export { applyComposition, isEligible, rankSections, scoreSection, shellFor } from "./select";
export type { RankContext, ShellChoice } from "./select";
export { themeFit } from "./theme";
export type { ThemeFit } from "./theme";
export {
  compositionEvidence,
  compositionFingerprint,
  critique,
  findRenderedSections,
  formatEvidenceBrief,
  formatSectionBrief,
} from "./verify";
export type { CheckEvidence, RenderedSectionCheck } from "./verify";
