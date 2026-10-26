export type RuntimeEnvironmentKind = "building" | "error" | "production" | "development";

export interface RuntimeEnvironmentStatus {
  kind: RuntimeEnvironmentKind;
  label: string;
}

const BUILDING_STATUSES: ReadonlySet<string> = new Set(["PROVISIONING", "BUILDING"]);

export function deriveRuntimeEnvironment(input: {
  status: string;
  hasProductionDeployment: boolean;
}): RuntimeEnvironmentStatus {
  if (BUILDING_STATUSES.has(input.status)) return { kind: "building", label: "Building" };
  if (input.status === "ERROR") return { kind: "error", label: "Error" };
  if (input.hasProductionDeployment) return { kind: "production", label: "Production" };
  return { kind: "development", label: "Development" };
}
