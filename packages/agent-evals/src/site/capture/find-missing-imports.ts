const IMPORT_PATTERN = /(?:import|export)\s[^"'`]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']/g;
const SOURCE_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".css", ".json"] as const;
const INDEX_FILES = ["index.ts", "index.tsx", "index.js"] as const;
const ALIAS_PREFIX = "@/";
const ALIAS_ROOT = "src/";

export interface MissingImport {
  readonly file: string;
  readonly specifier: string;
}

function normalize(parts: readonly string[]): string {
  const stack: string[] = [];
  for (const part of parts.flatMap((entry) => entry.split("/"))) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function targetOf(file: string, specifier: string): string | null {
  if (specifier.startsWith(ALIAS_PREFIX)) return normalize([ALIAS_ROOT, specifier.slice(ALIAS_PREFIX.length)]);
  if (specifier.startsWith(".")) return normalize([...file.split("/").slice(0, -1), ...specifier.split("/")]);
  return null;
}

function exists(target: string, files: ReadonlySet<string>): boolean {
  return (
    SOURCE_EXTENSIONS.some((extension) => files.has(`${target}${extension}`)) ||
    INDEX_FILES.some((index) => files.has(`${target}/${index}`))
  );
}

function specifiersIn(content: string): string[] {
  return [...content.matchAll(IMPORT_PATTERN)].flatMap((match) => {
    const specifier = match[1] ?? match[2] ?? match[3];
    return specifier ? [specifier] : [];
  });
}

export function findMissingImports(sources: ReadonlyMap<string, string>): MissingImport[] {
  const files = new Set(sources.keys());
  return [...sources.entries()]
    .filter(([file]) => /\.(tsx?|jsx?)$/.test(file))
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .flatMap(([file, content]) =>
      specifiersIn(content).flatMap((specifier) => {
        const target = targetOf(file, specifier);
        return target !== null && !exists(target, files) ? [{ file, specifier }] : [];
      }),
    );
}
