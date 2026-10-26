import { describe, expect, it } from "bun:test";
import { CHOOSE_MYSELF_OPTION, CREATIVE_CHOICE_NEEDS, DECIDE_FOR_ME_OPTION, type AssetRequestResponse } from "@repo/contracts";
import type { IntakeControls, IntakeGate } from "../src/features/agent/intake/types";
import { approvePlan } from "../src/features/agent/intake/plan-round";
import type { OutgoingMessage } from "../src/features/agent/hooks/useSendMessage";
import {
  autoImageBlueprintIds,
  splitAutoImageRequests,
} from "../src/features/agent/questions/chat-dock/auto-image-requests";

const plan = { blueprintId: "bp-1", pages: [], features: [] } as unknown as NonNullable<IntakeGate["plan"]>;

function controlsFor(answers: IntakeGate["answers"]) {
  const delivered: OutgoingMessage[] = [];
  let gate: IntakeGate | null = {
    prompt: "Build a yoga studio site",
    status: "reviewing-plan",
    questions: [],
    asked: [],
    answers,
    error: null,
    afterSeq: 3,
    plan,
  };
  const controls: IntakeControls = {
    get gate() {
      return gate;
    },
    setGate: (value) => {
      gate = typeof value === "function" ? value(gate) : value;
    },
    sessionId: "s1",
    activePromptRef: { current: null },
    deliver: (message) => {
      delivered.push(message);
    },
  };
  return { controls, delivered, current: () => gate };
}

describe("approvePlan with a design choice", () => {
  it("decide for me skips the design picker and sends the plan without a theme", () => {
    const { controls, delivered, current } = controlsFor({ [CREATIVE_CHOICE_NEEDS.design]: DECIDE_FOR_ME_OPTION });
    approvePlan(controls);
    expect(current()?.status).toBe("sent");
    expect(delivered).toHaveLength(1);
    expect(delivered[0]?.blueprintId).toBe("bp-1");
    expect(delivered[0]?.theme).toBeUndefined();
  });

  it("I'll choose opens the design picker and sends nothing yet", () => {
    const { controls, delivered, current } = controlsFor({ [CREATIVE_CHOICE_NEEDS.design]: CHOOSE_MYSELF_OPTION });
    approvePlan(controls);
    expect(current()?.status).toBe("choosing-theme");
    expect(delivered).toHaveLength(0);
  });
});

function request(id: string, blueprintId: string, slotStatus: string): AssetRequestResponse {
  return {
    id,
    sessionId: "s1",
    blueprintId,
    status: "PENDING",
    createdAt: "2026-10-27T00:00:00.000Z",
    slots: [{ id: `${id}-hero`, status: slotStatus }],
  } as unknown as AssetRequestResponse;
}

describe("auto image requests", () => {
  it("collects blueprints whose approval said decide for me", () => {
    const ids = autoImageBlueprintIds([
      { data: { blueprintId: "bp-1", imageChoice: "auto" } },
      { data: { blueprintId: "bp-2" } },
      { data: null },
    ]);
    expect([...ids]).toEqual(["bp-1"]);
  });

  it("auto-fills those requests and keeps the rest, and any failed slot, in the dock", () => {
    const { auto, manual } = splitAutoImageRequests(
      [request("a", "bp-1", "PENDING"), request("b", "bp-2", "PENDING"), request("c", "bp-1", "FAILED")],
      new Set(["bp-1"]),
    );
    expect(auto.map((item) => item.id)).toEqual(["a"]);
    expect(manual.map((item) => item.id)).toEqual(["b", "c"]);
  });
});
