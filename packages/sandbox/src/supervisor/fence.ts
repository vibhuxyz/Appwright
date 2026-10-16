import { existsSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";

export class FenceViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FenceViolationError";
  }
}

export function resolveSafePath(sandboxRoot: string, requestPath: string): string {
  const root = resolve(sandboxRoot);
  const target = resolve(root, requestPath);

  const isInside = target === root || target.startsWith(root + sep);
  if (!isInside) {
    throw new FenceViolationError(`Path escapes sandbox root: ${requestPath}`);
  }

  if (existsSync(target)) {
    const realTarget = realpathSync(target);
    const realRoot = existsSync(root) ? realpathSync(root) : root;
    const isRealInside = realTarget === realRoot || realTarget.startsWith(realRoot + sep);
    if (!isRealInside) {
      throw new FenceViolationError(`Realpath escapes sandbox root: ${requestPath}`);
    }
  }

  return target;
}
