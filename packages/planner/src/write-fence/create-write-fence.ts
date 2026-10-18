import { canonicalizeDeclaration } from "../ownership";
import { normalizeWorkspacePath } from "./normalize-path";
import type { FenceDecision, WriteFence } from "./types";

function isInsidePrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function createWriteFence(owns: readonly string[]): WriteFence {
  const ownedPrefixes = [
    ...new Set(
      owns
        .map(canonicalizeDeclaration)
        .filter((resource) => resource.kind === "file")
        .map((resource) => resource.value),
    ),
  ].sort();

  function check(rawPath: string): FenceDecision {
    const normalized = normalizeWorkspacePath(rawPath);
    if (!normalized.ok) {
      return {
        allowed: false,
        path: rawPath,
        reason: `Cannot write "${rawPath}": ${normalized.reason}`,
      };
    }
    const isOwned = ownedPrefixes.some((prefix) => isInsidePrefix(normalized.path, prefix));
    if (isOwned) return { allowed: true, path: normalized.path };
    return {
      allowed: false,
      path: normalized.path,
      reason: `Cannot write "${normalized.path}": outside the files this task owns`,
    };
  }

  return { ownedPrefixes, check };
}
