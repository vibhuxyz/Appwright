import { describe, expect, it } from "bun:test";
import { deriveRuntimeEnvironment } from "../src/features/projects/runtime-environment/derive-runtime-environment";

describe("deriveRuntimeEnvironment", () => {
  it("labels a ready project without a deployment as Development", () => {
    expect(deriveRuntimeEnvironment({ status: "READY", hasProductionDeployment: false }))
      .toEqual({ kind: "development", label: "Development" });
  });

  it("labels a ready project with a deployment as Production", () => {
    expect(deriveRuntimeEnvironment({ status: "READY", hasProductionDeployment: true }).label).toBe("Production");
  });

  it("keeps building and error states ahead of the environment", () => {
    expect(deriveRuntimeEnvironment({ status: "BUILDING", hasProductionDeployment: true }).kind).toBe("building");
    expect(deriveRuntimeEnvironment({ status: "ERROR", hasProductionDeployment: false }).kind).toBe("error");
  });
});
