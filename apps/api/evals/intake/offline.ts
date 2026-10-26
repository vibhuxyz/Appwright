import { FakeProvider } from "@repo/agent-core";
import { generateIntakeQuestions } from "../../src/intake";
import { INTAKE_EVAL_CASES } from "./cases";
import { caseFailures } from "./score";

const NO_MODEL_QUESTIONS = `{"questions":[]}`;

const rows = await Promise.all(
  INTAKE_EVAL_CASES.map(async (evalCase) => {
    const questions = await generateIntakeQuestions(
      evalCase.prompt,
      new FakeProvider([{ kind: "text", text: NO_MODEL_QUESTIONS }]),
    );
    const failures = caseFailures({ ...evalCase, mustMention: [] }, questions);
    return { name: evalCase.name, needs: questions.map((question) => question.need), failures };
  }),
);

for (const row of rows) {
  const status = row.failures.length === 0 ? "PASS" : `FAIL (${row.failures.join("; ")})`;
  process.stdout.write(`${row.name.padEnd(28)} [${row.needs.join(", ")}]  ${status}\n`);
}
if (rows.some((row) => row.failures.length > 0)) process.exitCode = 1;
