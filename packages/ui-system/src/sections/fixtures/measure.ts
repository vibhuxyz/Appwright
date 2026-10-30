import type { ProjectType } from "@repo/contracts";
import { detectPlaybook } from "../playbook";
import { applyComposition, shellFor, type ShellChoice } from "../select";
import { compositionEvidence, critique, type CheckEvidence } from "../verify";
import { FIXTURES } from "./projects";

export interface FixturePageResult {
  route: string;
  sectionIds: readonly string[];
  issues: readonly string[];
}

export interface FixtureResult {
  name: string;
  projectType: ProjectType;
  shell: ShellChoice;
  pages: readonly FixturePageResult[];
  evidence: readonly CheckEvidence[];
  durationMs: number;
}

export function measureFixture(name: string): FixtureResult | undefined {
  const fixture = FIXTURES.find((item) => item.name === name);
  if (!fixture) return undefined;
  const started = performance.now();
  const composed = applyComposition(fixture.blueprint, fixture.blueprint.projectType ?? "other");
  const durationMs = performance.now() - started;
  return {
    name,
    projectType: composed.projectType ?? "other",
    shell: shellFor(composed),
    pages: composed.pages.map((page) => ({
      route: page.route,
      sectionIds: (page.sections ?? []).map((section) => section.sectionId),
      issues: critique(page.sections ?? [], detectPlaybook(page.purpose)),
    })),
    evidence: compositionEvidence(composed.pages),
    durationMs,
  };
}

export function measureFixtures(): FixtureResult[] {
  return FIXTURES.flatMap((fixture) => {
    const result = measureFixture(fixture.name);
    return result ? [result] : [];
  });
}
