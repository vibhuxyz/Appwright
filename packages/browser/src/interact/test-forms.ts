import { makeFinding, type Finding } from "../findings";
import type { FormDescriptor } from "../session";
import { valueFor, type FormScenario } from "./form-values";
import { judgeSubmission } from "./judge-form";
import { EMPTY_INTERACTION_RESULT, mergeInteractionResults, type InteractContext, type InteractionResult } from "./types";

const MAX_FORMS_TESTED = 3;

function scenariosFor(form: FormDescriptor): FormScenario[] {
  const scenarios: FormScenario[] = [];
  if (form.fields.some((field) => field.required)) scenarios.push("empty");
  if (form.fields.some((field) => field.kind === "email")) scenarios.push("invalid-email");
  scenarios.push("valid");
  return scenarios;
}

function noteResult(note: string): InteractionResult {
  return { ...EMPTY_INTERACTION_RESULT, notes: [note] };
}

async function fillForm(
  ctx: InteractContext,
  form: FormDescriptor,
  scenario: FormScenario,
): Promise<string | null> {
  for (const field of form.fields) {
    const result = await ctx.page.fillField(form.index, field, valueFor(field, scenario));
    if (!result.ok) return `could not fill "${field.label}": ${result.reason}`;
  }
  return null;
}

async function runScenario(
  ctx: InteractContext,
  formIndex: number,
  scenario: FormScenario,
): Promise<InteractionResult> {
  const where = { route: ctx.route, viewport: ctx.viewport };
  await ctx.page.navigate(ctx.url);
  const form = (await ctx.page.listForms()).find((candidate) => candidate.index === formIndex);
  if (!form) return noteResult(`${ctx.route}: form ${formIndex + 1} was gone when "${scenario}" ran`);
  if (scenario !== "empty") {
    const failure = await fillForm(ctx, form, scenario);
    if (failure) return noteResult(`${ctx.route} (${ctx.viewport}) form "${form.label}": ${failure}`);
  }
  ctx.page.drainEvents();
  const submitted = await ctx.page.submitForm(formIndex);
  const events = ctx.page.drainEvents();
  const problems = submitted.ok
    ? judgeSubmission({ scenario, formLabel: form.label, outcome: submitted.value, events })
    : [{ kind: "interaction-error" as const, message: `Could not click submit on "${form.label}": ${submitted.reason}` }];
  if (problems.length === 0) return EMPTY_INTERACTION_RESULT;
  const screenshot = await ctx.capture(`form-${formIndex + 1}-${scenario}`);
  const findings: Finding[] = problems.map((problem) => ({
    ...makeFinding(problem.kind, where, problem.message),
    screenshot,
  }));
  return { ...EMPTY_INTERACTION_RESULT, findings, screenshots: [screenshot] };
}

async function testForm(ctx: InteractContext, form: FormDescriptor): Promise<InteractionResult> {
  const where = { route: ctx.route, viewport: ctx.viewport };
  if (!form.hasSubmit) {
    const message = `The form "${form.label}" has no submit button`;
    return { ...EMPTY_INTERACTION_RESULT, findings: [makeFinding("form-no-submit", where, message)] };
  }
  const results: InteractionResult[] = [];
  for (const scenario of scenariosFor(form)) {
    results.push(await runScenario(ctx, form.index, scenario));
  }
  return { ...mergeInteractionResults(results), formsTested: 1 };
}

export async function testForms(ctx: InteractContext): Promise<InteractionResult> {
  const forms = (await ctx.page.listForms()).filter((form) => form.fields.length > 0);
  const results: InteractionResult[] = [];
  for (const form of forms.slice(0, MAX_FORMS_TESTED)) {
    results.push(await testForm(ctx, form));
  }
  const skipped = forms.length - MAX_FORMS_TESTED;
  const note = skipped > 0 ? [noteResult(`${ctx.route}: ${skipped} more form(s) not tested (cap ${MAX_FORMS_TESTED})`)] : [];
  return mergeInteractionResults([...results, ...note]);
}
