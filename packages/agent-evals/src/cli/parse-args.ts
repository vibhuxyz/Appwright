import { DEFAULT_EVAL_MODEL, DEFAULT_TRIALS } from "../core/constants";

export interface CliOptions {
  readonly model: string;
  readonly trials: number;
  readonly caseIds: readonly string[];
  readonly tag: string | undefined;
  readonly minPassRate: number;
}

function flagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

export function parseArgs(args: readonly string[], env: Readonly<Record<string, string | undefined>>): CliOptions {
  const trials = Number(flagValue(args, "--trials") ?? DEFAULT_TRIALS);
  const minPassRate = Number(flagValue(args, "--min-pass") ?? 0);
  if (!Number.isInteger(trials) || trials < 1) throw new Error(`--trials must be a positive integer, got ${trials}`);
  if (Number.isNaN(minPassRate) || minPassRate < 0 || minPassRate > 1) {
    throw new Error(`--min-pass must be between 0 and 1, got ${minPassRate}`);
  }
  const caseFlag = flagValue(args, "--case");
  return {
    model: flagValue(args, "--model") ?? env.EVAL_MODEL ?? DEFAULT_EVAL_MODEL,
    trials,
    caseIds: caseFlag ? caseFlag.split(",") : [],
    tag: flagValue(args, "--tag"),
    minPassRate,
  };
}
