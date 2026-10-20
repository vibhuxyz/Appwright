import {
  applyFileToolOps,
  readProjectFile,
  writeProjectFile,
  type FileToolOp,
} from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { isDenied, isGeneratedUiPrimitive } from "@repo/tools";
import { z } from "zod";
import { log } from "../log";

const toolCallDataSchema = z.object({
  toolName: z.string(),
  args: z.unknown(),
});

const writeFileArgsSchema = z.object({
  path: z.string().min(1).max(512),
  content: z.string(),
});

const editFileArgsSchema = z.object({
  path: z.string().min(1).max(512),
  oldString: z.string(),
  newString: z.string(),
});

function opsFromToolCalls(rows: readonly { data: unknown }[]): FileToolOp[] {
  const ops: FileToolOp[] = [];

  for (const row of rows) {
    const call = toolCallDataSchema.safeParse(row.data);
    if (!call.success) continue;

    if (call.data.toolName === "write_file") {
      const args = writeFileArgsSchema.safeParse(call.data.args);
      if (!args.success) continue;
      ops.push({
        kind: "write_file",
        path: args.data.path,
        content: args.data.content,
      });
      continue;
    }

    if (call.data.toolName === "edit_file") {
      const args = editFileArgsSchema.safeParse(call.data.args);
      if (!args.success) continue;
      ops.push({
        kind: "edit_file",
        path: args.data.path,
        oldString: args.data.oldString,
        newString: args.data.newString,
      });
    }
  }

  return ops;
}

async function existingForEdits(
  projectId: string,
  sessionId: string,
  ops: readonly FileToolOp[],
): Promise<Map<string, string>> {
  const existing = new Map<string, string>();
  const editPaths = new Set(
    ops.filter((op) => op.kind === "edit_file").map((op) => op.path),
  );

  for (const relPath of editPaths) {
    try {
      existing.set(relPath, await readProjectFile(projectId, relPath, sessionId));
    } catch {
      // File is not on disk yet; applyFileToolOps skips the edit until a write.
    }
  }

  return existing;
}

// E2B writes never land on the host worktree. The Files pane and local
// preview read that worktree, so replay persisted write_file / edit_file
// args onto disk. Idempotent: unchanged content is left alone.
export async function hydrateSessionFilesFromToolCalls(
  projectId: string,
  sessionId: string,
): Promise<number> {
  try {
    const rows = await prisma.message.findMany({
      where: { sessionId, type: "toolCall" },
      orderBy: { seq: "asc" },
      select: { data: true },
    });

    const ops = opsFromToolCalls(rows);
    if (ops.length === 0) return 0;

    const existing = await existingForEdits(projectId, sessionId, ops);
    const files = applyFileToolOps(ops, existing);

    let written = 0;
    for (const [relPath, content] of files) {
      if (isDenied(relPath) || isGeneratedUiPrimitive(relPath)) continue;

      let current: string | null = null;
      try {
        current = await readProjectFile(projectId, relPath, sessionId);
      } catch {
        current = null;
      }
      if (current === content) continue;

      await writeProjectFile(projectId, relPath, content, sessionId);
      written += 1;
    }

    return written;
  } catch (err) {
    log.warn("session file hydrate failed", {
      projectId,
      sessionId,
      err: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
