import type { PlanTask } from "../schemas/plan-schemas";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export const STATUS_PRESENTATION = {
  pending: { label: "Waiting", tone: "neutral" },
  ready: { label: "Ready", tone: "accent" },
  running: { label: "Running", tone: "accent" },
  blocked: { label: "Blocked", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  done: { label: "Done", tone: "success" },
} as const satisfies Record<PlanTask["status"], { label: string; tone: Tone }>;
