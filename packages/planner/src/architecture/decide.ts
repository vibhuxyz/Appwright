import { StackSchema } from "@repo/contracts";
import type { Needs } from "../requirements";
import type { ArchitectureDecision, FrozenArchitecture } from "./types";

const FIXED_STACK = StackSchema.parse({
  framework: "next",
  db: "mongodb",
  orm: "mongoose",
  auth: "authjs",
  styling: "tailwind",
});

const RULES: readonly {
  isTriggered: (needs: Needs) => boolean;
  decision: ArchitectureDecision;
}[] = [
  {
    isTriggered: (needs) => needs.realtime.required,
    decision: {
      capability: "realtime",
      choice: "websockets",
      reason: "needs.realtime requires server push",
    },
  },
  {
    isTriggered: (needs) => needs.payments.required,
    decision: {
      capability: "payments",
      choice: "stripe",
      reason: "needs.payments requires a hosted payment provider",
    },
  },
  {
    isTriggered: (needs) => needs.fileUpload.required,
    decision: {
      capability: "fileStorage",
      choice: "local-uploads",
      reason: "needs.fileUpload requires blob storage in the sandbox",
    },
  },
  {
    isTriggered: (needs) => needs.search.required,
    decision: {
      capability: "search",
      choice: "mongodb-text-index",
      reason: "needs.search is served by a MongoDB text index",
    },
  },
];

export function decideArchitecture(needs: Needs): FrozenArchitecture {
  const decisions = RULES.filter((rule) => rule.isTriggered(needs)).map(
    (rule) => Object.freeze({ ...rule.decision }),
  );
  return Object.freeze({
    stack: Object.freeze({ ...FIXED_STACK }),
    decisions: Object.freeze(decisions),
  });
}
