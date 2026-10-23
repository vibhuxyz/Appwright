import type { InteractionOutcome, ObservedEvents } from "../session";
import type { Problem } from "./judge-form";

const SERVER_ERROR_STATUS = 500;

export function judgeClick(name: string, outcome: InteractionOutcome, events: ObservedEvents): Problem[] {
  const subject = `Clicking "${name}"`;
  const serverErrors = outcome.requests
    .filter((request) => (request.status ?? 0) >= SERVER_ERROR_STATUS)
    .map((request) => ({
      kind: "interaction-error" as const,
      message: `${subject} got ${request.status} from ${request.method} ${request.path}`,
    }));
  const thrown = [...events.pageErrors, ...events.consoleErrors].map((message) => ({
    kind: "interaction-error" as const,
    message: `${subject} caused an error: ${message}`,
  }));
  return [...serverErrors, ...thrown];
}
