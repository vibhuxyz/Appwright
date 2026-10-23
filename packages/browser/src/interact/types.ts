import type { Finding } from "../findings";
import type { BrowserPage } from "../session";

export interface InteractContext {
  readonly page: BrowserPage;
  readonly url: string;
  readonly route: string;
  readonly viewport: string;
  readonly capture: (suffix: string) => Promise<string>;
}

export interface InteractionResult {
  readonly findings: readonly Finding[];
  readonly notes: readonly string[];
  readonly screenshots: readonly string[];
  readonly formsTested: number;
  readonly buttonsClicked: number;
}

export const EMPTY_INTERACTION_RESULT: InteractionResult = {
  findings: [],
  notes: [],
  screenshots: [],
  formsTested: 0,
  buttonsClicked: 0,
};

export function mergeInteractionResults(results: readonly InteractionResult[]): InteractionResult {
  return {
    findings: results.flatMap((result) => result.findings),
    notes: results.flatMap((result) => result.notes),
    screenshots: results.flatMap((result) => result.screenshots),
    formsTested: results.reduce((total, result) => total + result.formsTested, 0),
    buttonsClicked: results.reduce((total, result) => total + result.buttonsClicked, 0),
  };
}
