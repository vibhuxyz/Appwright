import type { ThemeOption } from "@repo/contracts";
import type { IntakeControls } from "./types";

export function deliverPlan(controls: IntakeControls, theme?: ThemeOption) {
  if (!controls.gate) return;
  const { prompt, answers, asked, plan, attachments, planFeedback } = controls.gate;
  controls.setGate({ ...controls.gate, status: "sent", ...(theme ? { theme } : {}), error: null });
  controls.deliver({
    prompt,
    ...(theme ? { theme } : {}),
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
    ...(asked.length > 0 ? { answers, questions: asked } : {}),
    ...(plan ? { blueprintId: plan.blueprintId } : {}),
    ...(planFeedback && planFeedback.length > 0 ? { planFeedback } : {}),
  });
}
