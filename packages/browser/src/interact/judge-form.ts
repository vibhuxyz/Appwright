import type { FindingKind } from "../findings";
import type { InteractionOutcome, ObservedEvents } from "../session";
import { INVALID_EMAIL, type FormScenario } from "./form-values";

const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;
const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface Problem {
  readonly kind: FindingKind;
  readonly message: string;
}

export interface JudgeInput {
  readonly scenario: FormScenario;
  readonly formLabel: string;
  readonly outcome: InteractionOutcome;
  readonly events: ObservedEvents;
}

const SCENARIO_TEXT: Readonly<Record<FormScenario, string>> = {
  empty: "empty",
  "invalid-email": `"${INVALID_EMAIL}" as the email`,
  valid: "filled-in",
};

function runtimeProblems({ scenario, formLabel, outcome, events }: JudgeInput): Problem[] {
  const subject = `Submitting the ${SCENARIO_TEXT[scenario]} form "${formLabel}"`;
  const serverErrors = outcome.requests
    .filter((request) => (request.status ?? 0) >= SERVER_ERROR_STATUS)
    .map((request) => ({
      kind: "form-server-error" as const,
      message: `${subject} got ${request.status} from ${request.method} ${request.path}`,
    }));
  const thrown = [...events.pageErrors, ...events.consoleErrors].map((message) => ({
    kind: "interaction-error" as const,
    message: `${subject} caused an error: ${message}`,
  }));
  return [...serverErrors, ...thrown];
}

function wasAccepted(outcome: InteractionOutcome): boolean {
  const savedData = outcome.requests.some(
    (request) =>
      !READ_ONLY_METHODS.has(request.method) &&
      request.status !== null &&
      request.status < CLIENT_ERROR_STATUS,
  );
  const moved = outcome.urlChanged && outcome.invalidFields.length === 0;
  return savedData || moved;
}

function validationProblem({ scenario, formLabel, outcome }: JudgeInput): Problem[] {
  if (scenario === "valid") return [];
  if (!wasAccepted(outcome)) return [];
  const kind = scenario === "empty" ? "form-accepts-empty" : "form-accepts-invalid";
  const what =
    scenario === "empty"
      ? "an empty submission although fields are marked required"
      : `"${INVALID_EMAIL}" as an email address`;
  return [{ kind, message: `The form "${formLabel}" accepted ${what}` }];
}

function responseProblem({ scenario, formLabel, outcome }: JudgeInput): Problem[] {
  if (scenario !== "valid" || outcome.invalidFields.length > 0) return [];
  const gaveFeedback =
    outcome.requests.length > 0 || outcome.urlChanged || outcome.newText.length > 0 || outcome.dialogShown;
  if (gaveFeedback) return [];
  return [
    {
      kind: "form-no-response",
      message: `Submitting the filled-in form "${formLabel}" did nothing: no request, no navigation and no message`,
    },
  ];
}

export function judgeSubmission(input: JudgeInput): Problem[] {
  return [...runtimeProblems(input), ...validationProblem(input), ...responseProblem(input)];
}
