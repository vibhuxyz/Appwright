import { OpenAiProvider, plannerModel } from "@repo/agent-core";
import { PlanIdSchema, type PlanId } from "@repo/contracts";
import { selectDiscoveryQuestions } from "@repo/planner";
import { QUESTIONS_TIMEOUT_MS, generateIntakeQuestions } from "../../src/intake";
import { INTAKE_EVAL_CASES, type IntakeEvalCase } from "./cases";
import { caseFailures, isSameAsCatalog, percentile, sharedNeedRate, type CaseResult } from "./score";

const MAX_PARALLEL_CASES = 3;
const P50 = 0.5;
const P90 = 0.9;
const PERCENT = 100;

async function runCase(evalCase: IntakeEvalCase, model: string): Promise<CaseResult> {
  const provider = new OpenAiProvider({ model });
  const startedAt = performance.now();
  const questions = await generateIntakeQuestions(
    evalCase.prompt,
    provider,
    AbortSignal.timeout(QUESTIONS_TIMEOUT_MS),
  );
  const latencyMs = Math.round(performance.now() - startedAt);
  const isCatalogFallback = isSameAsCatalog(questions, selectDiscoveryQuestions(evalCase.prompt));
  const failures = [...caseFailures(evalCase, questions), ...(isCatalogFallback ? ["fell back to catalog"] : [])];
  return { name: evalCase.name, latencyMs, needs: questions.map((question) => question.need), isCatalogFallback, failures };
}

async function runAll(cases: readonly IntakeEvalCase[], model: string): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (let start = 0; start < cases.length; start += MAX_PARALLEL_CASES) {
    const batch = cases.slice(start, start + MAX_PARALLEL_CASES);
    results.push(...(await Promise.all(batch.map((evalCase) => runCase(evalCase, model)))));
  }
  return results;
}

function report(results: readonly CaseResult[], model: string): string {
  const latencies = results.map((result) => result.latencyMs);
  const passed = results.filter((result) => result.failures.length === 0).length;
  const fallbacks = results.filter((result) => result.isCatalogFallback).length;
  const rows = results.map((result) => {
    const status = result.failures.length === 0 ? "PASS" : `FAIL (${result.failures.join("; ")})`;
    return `${result.name.padEnd(28)} ${String(result.latencyMs).padStart(6)}ms  [${result.needs.join(", ")}]  ${status}`;
  });
  return [
    `Intake eval — model ${model}`,
    ...rows,
    ``,
    `passed ${passed}/${results.length} · catalog fallbacks ${fallbacks} · latency p50 ${percentile(latencies, P50)}ms p90 ${percentile(latencies, P90)}ms`,
    `shared questions across prompts ${Math.round(sharedNeedRate(results) * PERCENT)}% (lower means more tailored)`,
  ].join("\n");
}

const plan: PlanId = PlanIdSchema.parse(process.env.EVAL_PLAN ?? "FREE");
const model = process.env.EVAL_MODEL ?? plannerModel(plan);
const results = await runAll(INTAKE_EVAL_CASES, model);
process.stdout.write(`${report(results, model)}\n`);
if (results.some((result) => result.failures.length > 0)) process.exitCode = 1;
