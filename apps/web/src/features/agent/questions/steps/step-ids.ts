export function questionStepId(questionId: string, questionIndex: number): string {
  return `q:${questionId}:${questionIndex}`;
}

export function integrationChoiceStepId(requirementId: string): string {
  return `i:${requirementId}:choice`;
}

export function integrationFieldStepId(requirementId: string, fieldKey: string): string {
  return `i:${requirementId}:${fieldKey}`;
}

export function credentialErrorKey(requirementId: string, fieldErrorKey: string): string {
  return `${requirementId}|${fieldErrorKey}`;
}
