import { ContactFields, ImageSectionDropzones, encodeContactAnswer } from "@/features/plan";
import { ChoiceQuestionStep, PlanReviewStep, TextAnswerStep, ThemeStep } from "../step-views";
import type { IntakeDock } from "./use-intake-dock";
import type { IntakeStep } from "./types";

type QuestionStep = Extract<IntakeStep, { kind: "question" }>;

function QuestionHeading({ step }: { step: QuestionStep }) {
  return (
    <div>
      <h3 className="text-[15px] leading-snug font-medium text-foreground">{step.question.label} — {step.question.text}</h3>
      {step.question.why && <p className="mt-1 text-xs text-muted">{step.question.why}</p>}
    </div>
  );
}

function QuestionBody({ step, dock, isSubmitting }: { step: QuestionStep; dock: IntakeDock; isSubmitting: boolean }) {
  const { question } = step;
  const error = dock.state.errors[step.id];
  const errorText = error ? <p role="alert" className="text-xs text-danger">{error}</p> : null;
  switch (question.inputType) {
    case "single":
    case "multiple":
      return (
        <ChoiceQuestionStep
          stepId={step.id}
          label={question.label}
          text={question.text}
          options={question.options}
          isMultiple={question.inputType === "multiple"}
          draft={dock.state.choiceDrafts[step.id]}
          error={error}
          onChange={(draft) => dock.actions.setChoice(step.id, draft)}
        />
      );
    case "short-text":
    case "date":
      return (
        <TextAnswerStep
          stepId={step.id}
          label={question.label}
          text={question.text}
          why={question.why}
          value={dock.state.answers[step.id] ?? ""}
          isDate={question.inputType === "date"}
          error={error}
          onChange={(value) => dock.actions.setAnswer(step.id, value)}
        />
      );
    case "images":
      return (
        <div className="space-y-2">
          <QuestionHeading step={step} />
          <ImageSectionDropzones sections={question.options} isSubmitting={isSubmitting} onContinue={(value) => dock.actions.continueWith(step.id, value)} />
          {errorText}
        </div>
      );
    case "contacts":
      return (
        <div className="space-y-2">
          <QuestionHeading step={step} />
          <ContactFields
            fields={question.options}
            value={dock.state.answers[step.id] ?? encodeContactAnswer(question.prefill ?? {})}
            isSubmitting={isSubmitting}
            onChange={(value) => dock.actions.setAnswer(step.id, value)}
          />
          {errorText}
        </div>
      );
    default: {
      const unhandled: never = question.inputType;
      return unhandled;
    }
  }
}

export function IntakeStepBody({ dock, isSubmitting }: { dock: IntakeDock; isSubmitting: boolean }) {
  const step = dock.currentStep;
  if (!step) return <p role="status" className="text-sm text-muted">Preparing questions…</p>;
  if (step.kind === "question") return <QuestionBody key={step.id} step={step} dock={dock} isSubmitting={isSubmitting} />;
  if (step.kind === "plan-review") {
    return (
      <PlanReviewStep
        stepId={step.id}
        plan={step.plan}
        draft={dock.state.choiceDrafts[step.id]}
        error={dock.state.errors[step.id]}
        onChange={(draft) => dock.actions.setChoice(step.id, draft)}
      />
    );
  }
  return (
    <ThemeStep
      themes={dock.theme.themes}
      selectedId={dock.theme.selectedId}
      isPending={dock.theme.isPending}
      loadError={dock.theme.loadError}
      isPreset={dock.theme.isPreset}
      onSelect={dock.actions.selectTheme}
      onApplyOverrides={dock.actions.applyThemeOverrides}
    />
  );
}
