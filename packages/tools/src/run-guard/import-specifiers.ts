import { builtinModules } from "node:module";
import { CODE_FILE_PATTERN, LOCAL_SPECIFIER_PREFIXES } from "./constants";

const STATIC_IMPORT = /(?:^|[\s;])(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?["']([^"'\n]+)["']/g;
const CALL_IMPORT = /\b(?:import|require)\s*\(\s*["']([^"'\n]+)["']\s*\)/g;

const BUILTIN_MODULES: ReadonlySet<string> = new Set(builtinModules);

export function isCodeFile(path: string): boolean {
  return CODE_FILE_PATTERN.test(path);
}

function isLocalSpecifier(specifier: string): boolean {
  return LOCAL_SPECIFIER_PREFIXES.some((prefix) => specifier.startsWith(prefix));
}

export function packageNameOf(specifier: string): string | undefined {
  if (isLocalSpecifier(specifier)) return undefined;
  const [first, second] = specifier.split("/");
  if (!first) return undefined;
  const name = first.startsWith("@") ? (second ? `${first}/${second}` : undefined) : first;
  if (!name || BUILTIN_MODULES.has(name)) return undefined;
  return name;
}

function capturedSpecifiers(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].flatMap((match) => (match[1] ? [match[1]] : []));
}

export function importedPackages(source: string): string[] {
  const specifiers = [
    ...capturedSpecifiers(source, STATIC_IMPORT),
    ...capturedSpecifiers(source, CALL_IMPORT),
  ];
  const names = specifiers.flatMap((specifier) => {
    const name = packageNameOf(specifier);
    return name ? [name] : [];
  });
  return [...new Set(names)].sort();
}
