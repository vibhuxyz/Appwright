import { describe, expect, it } from "bun:test";
import {
  DEFAULT_DESIGN_BLOCK,
  DEFAULT_LAYOUT_BLOCK,
  DEFAULT_RESPONSIVE_BLOCK,
} from "@repo/contracts";
import {
  applyConfirmedChange,
  compileTasks,
  reviewChangeRequest,
  type ChangeRequest,
} from "../src";

const FOOD_DELIVERY = {
  blueprintVersion: 1,
  intent: {
    type: "marketplace",
    domain: "food-delivery",
    complexity: "medium" as const,
  },
  stack: {
    framework: "next" as const,
    db: "postgres" as const,
    orm: "prisma" as const,
    auth: "authjs" as const,
    styling: "tailwind" as const,
  },
  entities: [
    {
      name: "Restaurant",
      fields: [{ name: "name", type: "String" as const, required: true, unique: false }],
      relations: [],
    },
  ],
  pages: [{ route: "/", purpose: "browse restaurants", components: [] }],
  features: [],
  theme: { preset: "clean-modern", primary: "#e23744" },
  design: DEFAULT_DESIGN_BLOCK,
  layout: DEFAULT_LAYOUT_BLOCK,
  responsive: DEFAULT_RESPONSIVE_BLOCK,
};

function changeRequest(patch: ChangeRequest["patch"]): ChangeRequest {
  return { taskId: "scaffold", why: "needs a second entity", patch, blocks: [] };
}

describe("reviewChangeRequest", () => {
  it("rejects a request against an unknown task", () => {
    const tasks = compileTasks(FOOD_DELIVERY);
    const decision = reviewChangeRequest(
      { ...changeRequest({ features: ["auth"] }), taskId: "ghost" },
      FOOD_DELIVERY,
      tasks,
    );
    expect(decision.status).toBe("rejected");
  });

  it("rejects a request naming an unknown blocked task", () => {
    const tasks = compileTasks(FOOD_DELIVERY);
    const decision = reviewChangeRequest(
      { ...changeRequest({ features: ["auth"] }), blocks: ["ghost"] },
      FOOD_DELIVERY,
      tasks,
    );
    expect(decision.status).toBe("rejected");
  });

  it("requires confirmation for a stack change instead of approving it", () => {
    const tasks = compileTasks(FOOD_DELIVERY);
    const decision = reviewChangeRequest(
      changeRequest({ stack: { ...FOOD_DELIVERY.stack } }),
      FOOD_DELIVERY,
      tasks,
    );
    expect(decision.status).toBe("needs_confirmation");
  });

  it("approves a non-stack change and reports only the affected tasks", () => {
    const tasks = compileTasks(FOOD_DELIVERY);
    const decision = reviewChangeRequest(
      changeRequest({ features: ["auth"] }),
      FOOD_DELIVERY,
      tasks,
    );
    expect(decision.status).toBe("approved");
    if (decision.status !== "approved") return;
    expect(decision.blueprint.blueprintVersion).toBe(2);
    expect(decision.affectedTaskIds).toContain("auth");
    expect(decision.affectedTaskIds).not.toContain("scaffold");
  });

  it("rejects a patch that fails blueprint validation", () => {
    const tasks = compileTasks(FOOD_DELIVERY);
    const decision = reviewChangeRequest(
      changeRequest({ pages: [] }),
      FOOD_DELIVERY,
      tasks,
    );
    expect(decision.status).toBe("rejected");
  });
});

describe("applyConfirmedChange", () => {
  it("recomputes tasks once the user confirms a stack change", () => {
    const tasks = compileTasks(FOOD_DELIVERY);
    const confirmed = { ...FOOD_DELIVERY, blueprintVersion: 2 };
    const decision = applyConfirmedChange(confirmed, tasks);
    expect(decision.status).toBe("approved");
  });
});
