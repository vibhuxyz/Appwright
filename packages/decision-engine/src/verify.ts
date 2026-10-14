export interface VerifyOutcome {
  passed: boolean;
  output: string;
}

// The existing tsc retry loop (apps/api/src/routes/conversation.ts) always
// spent its full attempt budget, even when the second attempt's error was
// byte-for-byte the first's — a fix that didn't change the error isn't
// "one more chance," it's the same failure again. This is that judgment
// call, pulled out so it's testable without a real tsc process behind it.
export function shouldRetryVerification(
  history: VerifyOutcome[],
  maxAttempts: number,
): boolean {
  const last = history.at(-1);
  if (!last || last.passed) return false;
  if (history.length > maxAttempts) return false;

  const prev = history.at(-2);
  if (prev && !prev.passed && prev.output === last.output) return false;

  return true;
}
