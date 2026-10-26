import { describe, expect, it } from "bun:test";
import { toPlannerProgress } from "../src/plan-preview/plan-progress";

describe("toPlannerProgress", () => {
  it("turns streamed pages into readable page lines", () => {
    const progress = toPlannerProgress({
      stage: "pages",
      detail: "Planning /booking",
      pages: [{ route: "/booking", components: ["BookingForm", "PaymentModal"] }],
    });
    expect(progress).toEqual({ tool: "planner", detail: "Planning /booking", items: ["/booking — Booking Form, Payment Modal"] });
  });
});
