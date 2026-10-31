import { describe, expect, it } from "bun:test";
import { CreateSessionRequest, UpdateSessionRequest } from "../src/session.schema";

describe("CreateSessionRequest", () => {
  it("does not accept another session id", () => {
    const parsed = CreateSessionRequest.parse({
      title: "RK Home Planner",
      fromSessionId: "cmvmb2lk20001dxnndbq1to5l",
    });
    expect(parsed).toEqual({ title: "RK Home Planner" });
    expect(parsed).not.toHaveProperty("fromSessionId");
  });
});

describe("UpdateSessionRequest", () => {
  it("accepts Auto and an effort-only change", () => {
    expect(UpdateSessionRequest.parse({ model: "auto" })).toEqual({ model: "auto" });
    expect(UpdateSessionRequest.parse({ effort: "high" })).toEqual({ effort: "high" });
  });
});
