const ANSI_SEQUENCE = /\u001b\[[0-9;?]*[ -/]*[@-~]/g;

export function stripAnsi(text: string): string {
  return text.replace(ANSI_SEQUENCE, "");
}

export function splitLines(pending: string, chunk: string): { lines: string[]; pending: string } {
  const parts = (pending + chunk).split(/\r?\n/);
  const rest = parts.pop() ?? "";
  return { lines: parts.map(stripAnsi).filter((line) => line.trim().length > 0), pending: rest };
}
