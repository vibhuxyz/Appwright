import {
  DEFAULT_DESIGN_BLOCK,
  type DependencyManifest,
  type DesignBlock,
  DesignBlockSchema,
  type Entity,
  EntitySchema,
  type Page,
  PageSchema,
  type ProjectSpecification,
} from "@repo/contracts";
import { z } from "zod";
import { acceptanceFor } from "./acceptance-for";
import { assetHintsFor } from "./asset-hints";

export interface TaskDetail {
  projectId: string;
  type: string;
  title: string;
  owns: string[];
  reads: string[];
  acceptance: string[];
  assetHints: string[];
  entities: Entity[];
  pages: Page[];
  features: string[];
  design: DesignBlock;
  manifest?: DependencyManifest;
  specification?: ProjectSpecification;
}

export interface TaskDetailSource {
  readonly projectId: string;
  readonly task: { readonly type: string; readonly title: string; readonly owns: unknown; readonly reads: unknown };
  readonly blueprint: {
    readonly requirements: unknown;
    readonly entities: unknown;
    readonly pages: unknown;
    readonly features: unknown;
    readonly design: unknown;
    readonly dependencyManifest: unknown;
    readonly specification: unknown;
  };
  readonly assetSlotLists: readonly unknown[];
}

export function buildTaskDetail(source: TaskDetailSource): TaskDetail {
  const { task, blueprint } = source;
  return {
    projectId: source.projectId,
    type: task.type,
    title: task.title,
    owns: task.owns as string[],
    reads: task.reads as string[],
    acceptance: acceptanceFor(task.type, blueprint.requirements),
    assetHints: assetHintsFor(task.title, source.assetSlotLists),
    entities: z.array(EntitySchema).parse(blueprint.entities),
    pages: z.array(PageSchema).parse(blueprint.pages),
    features: z.array(z.string()).parse(blueprint.features),
    design: blueprint.design ? DesignBlockSchema.parse(blueprint.design) : DEFAULT_DESIGN_BLOCK,
    manifest: blueprint.dependencyManifest ? (blueprint.dependencyManifest as DependencyManifest) : undefined,
    specification: blueprint.specification ? (blueprint.specification as ProjectSpecification) : undefined,
  };
}
