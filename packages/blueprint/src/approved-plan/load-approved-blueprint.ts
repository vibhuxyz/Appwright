import { DEFAULT_DESIGN_BLOCK, DesignBlockSchema, ThemeSchema, type ThemeOption } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import type { Plan } from "@repo/planner";
import { loadPlanForBlueprint } from "../load-plan";
import type { PersistedBlueprint } from "../persist-blueprint";
import { designWithTheme } from "./design-with-theme";

export interface ApprovedBlueprint {
  plan: Plan;
  persisted: PersistedBlueprint;
}

async function stampTheme(blueprintId: string, theme: ThemeOption): Promise<void> {
  const row = await prisma.blueprint.findUniqueOrThrow({
    where: { id: blueprintId },
    select: { design: true, theme: true },
  });
  const design = DesignBlockSchema.safeParse(row.design);
  const current = ThemeSchema.safeParse(row.theme);
  await prisma.blueprint.update({
    where: { id: blueprintId },
    data: {
      design: designWithTheme(design.success ? design.data : DEFAULT_DESIGN_BLOCK, theme) as Prisma.InputJsonValue,
      theme: {
        preset: current.success ? current.data.preset : "default",
        primary: theme.palette.primary,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function loadApprovedBlueprint(
  blueprintId: string,
  theme: ThemeOption | undefined,
): Promise<ApprovedBlueprint | undefined> {
  if (theme) await stampTheme(blueprintId, theme);
  const plan = await loadPlanForBlueprint(blueprintId);
  if (!plan) return undefined;
  return {
    plan,
    persisted: {
      blueprintId,
      blueprintVersion: plan.blueprint.blueprintVersion,
      tasks: plan.tasks.map((task) => ({
        id: task.id,
        type: task.type,
        title: task.title,
        dependsOn: plan.graph.dependsOn.get(task.id) ?? [],
      })),
    },
  };
}
