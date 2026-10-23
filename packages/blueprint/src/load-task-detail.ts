import {
  DEFAULT_DESIGN_BLOCK,
  type DesignBlock,
  DesignBlockSchema,
  type Entity,
  EntitySchema,
  type Page,
  PageSchema,
} from "@repo/contracts";
import { prisma } from "@repo/db";
import { z } from "zod";
import { acceptanceFor } from "./acceptance-for";
import { assetHintsFor } from "./asset-hints";

export interface TaskDetail {
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
}

export async function loadTaskDetail(taskId: string): Promise<TaskDetail> {
  const row = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    select: {
      type: true,
      title: true,
      owns: true,
      reads: true,
      blueprint: {
        select: {
          requirements: true,
          sessionId: true,
          entities: true,
          pages: true,
          features: true,
          design: true,
        },
      },
    },
  });
  const assetRequests = await prisma.assetRequest.findMany({
    where: { sessionId: row.blueprint.sessionId },
    select: { slots: true },
  });
  return {
    type: row.type,
    title: row.title,
    owns: row.owns as string[],
    reads: row.reads as string[],
    acceptance: acceptanceFor(row.type, row.blueprint.requirements),
    assetHints: assetHintsFor(row.title, assetRequests.map((request) => request.slots)),
    entities: z.array(EntitySchema).parse(row.blueprint.entities),
    pages: z.array(PageSchema).parse(row.blueprint.pages),
    features: z.array(z.string()).parse(row.blueprint.features),
    design: row.blueprint.design ? DesignBlockSchema.parse(row.blueprint.design) : DEFAULT_DESIGN_BLOCK,
  };
}
