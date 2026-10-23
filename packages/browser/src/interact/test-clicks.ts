import { makeFinding } from "../findings";
import type { ClickTarget } from "../session";
import { judgeClick } from "./judge-click";
import type { Problem } from "./judge-form";
import { chooseClickTargets } from "./safe-click";
import { EMPTY_INTERACTION_RESULT, mergeInteractionResults, type InteractContext, type InteractionResult } from "./types";

async function clickOne(ctx: InteractContext, wanted: ClickTarget): Promise<InteractionResult> {
  await ctx.page.navigate(ctx.url);
  const current = (await ctx.page.listClickTargets()).find((target) => target.name === wanted.name);
  if (!current) {
    return { ...EMPTY_INTERACTION_RESULT, notes: [`${ctx.route}: button "${wanted.name}" was gone on reload`] };
  }
  ctx.page.drainEvents();
  const clicked = await ctx.page.clickTarget(current.index);
  const events = ctx.page.drainEvents();
  const problems: Problem[] = clicked.ok
    ? judgeClick(wanted.name, clicked.value, events)
    : [{ kind: "interaction-error", message: `Could not click "${wanted.name}": ${clicked.reason}` }];
  if (problems.length === 0) return { ...EMPTY_INTERACTION_RESULT, buttonsClicked: 1 };
  const screenshot = await ctx.capture(`click-${current.index + 1}`);
  const where = { route: ctx.route, viewport: ctx.viewport };
  return {
    ...EMPTY_INTERACTION_RESULT,
    findings: problems.map((problem) => ({ ...makeFinding(problem.kind, where, problem.message), screenshot })),
    screenshots: [screenshot],
    buttonsClicked: 1,
  };
}

export async function testClicks(ctx: InteractContext): Promise<InteractionResult> {
  await ctx.page.navigate(ctx.url);
  const targets = chooseClickTargets(await ctx.page.listClickTargets());
  const results: InteractionResult[] = [];
  for (const target of targets) {
    results.push(await clickOne(ctx, target));
  }
  return mergeInteractionResults(results);
}
