import { z } from "zod";

const DependencyMapSchema = z.record(z.string(), z.string()).optional();

const PackageJsonSchema = z.object({
  dependencies: DependencyMapSchema,
  devDependencies: DependencyMapSchema,
  peerDependencies: DependencyMapSchema,
});

export type DeclaredPackages =
  | { readonly kind: "declared"; readonly names: ReadonlySet<string> }
  | { readonly kind: "unknown"; readonly reason: string };

export function declaredPackages(packageJsonText: string): DeclaredPackages {
  let raw: unknown;
  try {
    raw = JSON.parse(packageJsonText);
  } catch (error) {
    if (error instanceof SyntaxError) return { kind: "unknown", reason: "package.json is not valid JSON" };
    throw error;
  }
  const parsed = PackageJsonSchema.safeParse(raw);
  if (!parsed.success) return { kind: "unknown", reason: "package.json has an unexpected shape" };
  const { dependencies = {}, devDependencies = {}, peerDependencies = {} } = parsed.data;
  const names = new Set([
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
    ...Object.keys(peerDependencies),
  ]);
  return { kind: "declared", names };
}

export function missingPackages(imported: readonly string[], declared: ReadonlySet<string>): string[] {
  return imported.filter((name) => !declared.has(name));
}
