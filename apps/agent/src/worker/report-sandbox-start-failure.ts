import { prisma } from "@repo/db";
import { createLogger } from "@repo/logger";
import { publishStatus, type PersistFields } from "./persist";

const log = createLogger("agent-job");

export interface SandboxStartFailure {
  jobId: string;
  sessionId: string;
  error: unknown;
  persist: (fields: PersistFields) => Promise<unknown>;
}

export async function reportSandboxStartFailure(failure: SandboxStartFailure): Promise<undefined> {
  const message = failure.error instanceof Error ? failure.error.message : String(failure.error);
  log.error("job sandbox failed to start", { jobId: failure.jobId, sessionId: failure.sessionId, message });
  await prisma.session.update({ where: { id: failure.sessionId }, data: { status: "ERROR" } });
  await failure.persist({
    role: "assistant",
    type: "text",
    content: `Could not start a sandbox for this run: ${message}`,
    data: { stopReason: "fatalError" },
  });
  publishStatus(failure.sessionId, "ERROR", undefined, "fatalError");
  return undefined;
}
