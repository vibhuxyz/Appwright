import {
  InvalidOwnershipDeclarationError,
  type CanonicalResource,
  type ResourceKind,
} from "./types";

const RESOURCE_DECLARATION = /^(db|port|env):(.+)$/;
const GLOB_SUFFIX = /\/\*\*$/;

// D37: declare -> normalise -> expand -> canonicalise -> overlap check.
// `src/**` and `src/auth/**` do not look equal as strings and ARE an
// overlap once canonicalised to directory prefixes `src` and `src/auth`.
export function canonicalizeDeclaration(raw: string): CanonicalResource {
  const resourceMatch = raw.match(RESOURCE_DECLARATION);
  if (resourceMatch) {
    const kind = resourceMatch[1] as ResourceKind;
    const identifier = resourceMatch[2] ?? "";
    if (!identifier.trim()) {
      throw new InvalidOwnershipDeclarationError(raw, "empty resource identifier");
    }
    return { kind, value: identifier };
  }
  return { kind: "file", value: canonicalizeFilePath(raw) };
}

function canonicalizeFilePath(raw: string): string {
  if (raw.startsWith("/")) {
    throw new InvalidOwnershipDeclarationError(raw, "must be workspace-relative, not absolute");
  }

  const normalized = raw.startsWith("./") ? raw.slice(2) : raw;
  const expanded = normalized.replace(GLOB_SUFFIX, "");
  const canonical = expanded.replace(/\/+$/, "");

  if (!canonical) {
    throw new InvalidOwnershipDeclarationError(raw, "resolves to the workspace root");
  }

  for (const segment of canonical.split("/")) {
    if (segment === "." || segment === "..") {
      throw new InvalidOwnershipDeclarationError(raw, `"${segment}" segments are not allowed`);
    }
    if (segment.includes("*") && segment !== "**") {
      throw new InvalidOwnershipDeclarationError(
        raw,
        "only a trailing /** glob is supported, not a partial wildcard segment",
      );
    }
  }

  return canonical;
}
