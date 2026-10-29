import { answersByNeed, IntakeAnswersDataSchema } from "@repo/contracts";

interface AnswerRow {
  data: unknown;
}

export function answersFromRows(rows: readonly AnswerRow[]): Readonly<Record<string, string>> | undefined {
  const answers = rows.flatMap((row) => {
    const parsed = IntakeAnswersDataSchema.safeParse(row.data);
    return parsed.success ? parsed.data.answers : [];
  });
  return answers.length > 0 ? answersByNeed(answers) : undefined;
}
