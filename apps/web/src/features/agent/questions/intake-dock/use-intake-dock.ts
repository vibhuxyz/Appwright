import { useMemo, useReducer } from "react";
import { useThemeOptions } from "@/features/theme";
import { themeRequestFor } from "../../intake";
import { createIntakeDockActions } from "./intake-dock-actions";
import { INITIAL_INTAKE_DOCK_STATE, intakeDockReducer } from "./intake-dock-state";
import { buildIntakeSteps, intakeAutoAnswer } from "./intake-steps";
import type { IntakeDockControls } from "./types";

export function useIntakeDock(controls: IntakeDockControls) {
  const { gate } = controls;
  const [state, dispatch] = useReducer(intakeDockReducer, INITIAL_INTAKE_DOCK_STATE);
  const steps = useMemo(() => buildIntakeSteps(gate), [gate]);
  const themeRequest = useMemo(
    () => (gate.status === "choosing-theme" ? { ...themeRequestFor(gate), ...state.themeOverrides } : null),
    [gate, state.themeOverrides],
  );
  const themeQuery = useThemeOptions(themeRequest);
  const themes = themeQuery.data?.themes ?? [];
  const selectedTheme = themes.find((theme) => theme.id === state.themeId) ?? themes[0];
  const stepIndex = Math.min(state.stepIndex, Math.max(steps.length - 1, 0));
  const currentStep = steps[stepIndex];
  const actions = createIntakeDockActions({ controls, steps, state, stepIndex, themes, selectedTheme, dispatch });

  return {
    steps,
    stepIndex,
    currentStep,
    state,
    isLastStep: stepIndex >= steps.length - 1,
    canAutoAnswer: currentStep ? intakeAutoAnswer(currentStep, themes[0]?.id) !== null : false,
    theme: {
      themes,
      selectedId: selectedTheme?.id,
      isPending: themeQuery.isPending,
      isPreset: themeQuery.data?.source === "preset",
      loadError: themeQuery.error?.message ?? null,
    },
    actions,
  };
}

export type IntakeDock = ReturnType<typeof useIntakeDock>;
