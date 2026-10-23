import type {
  Blueprint,
  Entity,
  Page,
  ProjectType,
  Requirement,
  RequirementArea,
} from "@repo/contracts";
import type { Needs } from "../requirements";

export interface ProjectScope {
  readonly isBrowseOnly: boolean;
}

export interface TemplateAdditions {
  readonly pages: readonly Page[];
  readonly entities: readonly Entity[];
  readonly features: readonly string[];
  readonly acceptance: Readonly<Partial<Record<RequirementArea, readonly string[]>>>;
}

export type ProjectTemplate = (blueprint: Blueprint, scope: ProjectScope) => TemplateAdditions;

export interface ResolveInput {
  readonly blueprint: Blueprint;
  readonly prompt: string;
  readonly needs: Needs;
  readonly answers?: Readonly<Record<string, string>>;
}

export interface SkippedAddition {
  readonly kind: "page" | "entity" | "feature";
  readonly name: string;
  readonly reason: string;
}

export interface ResolvedRequirements {
  readonly blueprint: Blueprint;
  readonly projectType: ProjectType;
  readonly requirements: readonly Requirement[];
  readonly skipped: readonly SkippedAddition[];
}
