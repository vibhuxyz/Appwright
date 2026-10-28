import { VIEWPORTS, type Viewport } from "../findings";

export type ChangeRisk = "none" | "functional" | "visual" | "page";

export interface ChangeScope {
  readonly changedPaths: readonly string[];
  readonly addedPaths: readonly string[];
  readonly copyOnlyPaths?: readonly string[];
}

const SOURCE_FILE = /^(?:src\/|app\/)/;
const NON_UI_FILE = /(?:^|\/)(?:api|lib|server|models|db|actions|seed|scripts)\/|(?:^|\/)route\.[cm]?[jt]sx?$|\.d\.ts$|\.test\.[jt]sx?$|(?:^|\/)env\.[jt]s$/;
const SHARED_STYLE_FILE = /^(?:src\/|app\/)(?:app\/)?(?:theme|tokens|globals|index)\.css$/;
const PAGE_FILE = /(?:^|\/)page\.[jt]sx$|^src\/(?:pages|routes)\/.+\.[jt]sx$/;
const VIEWPORTS_BY_RISK: Readonly<Record<Exclude<ChangeRisk, "none">, readonly string[]>> = {
  functional: ["desktop"],
  visual: ["mobile", "desktop"],
  page: ["mobile", "tablet", "desktop"],
};

function normalise(path: string): string {
  return path.replaceAll("\\", "/");
}

export function isCopyOnlyChange(scope: ChangeScope): boolean {
  const copyOnly = new Set((scope.copyOnlyPaths ?? []).map(normalise));
  const source = scope.changedPaths.map(normalise).filter((path) => SOURCE_FILE.test(path));
  return copyOnly.size > 0 && source.length > 0 && source.every((path) => copyOnly.has(path));
}

export function classifyChange(scope: ChangeScope): ChangeRisk {
  if (isCopyOnlyChange(scope)) return "none";
  const source = scope.changedPaths.map(normalise).filter((path) => SOURCE_FILE.test(path));
  if (source.length === 0) return "none";
  if (source.some((path) => SHARED_STYLE_FILE.test(path))) return "page";
  if (scope.addedPaths.map(normalise).some((path) => SOURCE_FILE.test(path) && PAGE_FILE.test(path))) return "page";
  if (source.every((path) => NON_UI_FILE.test(path))) return "functional";
  return "visual";
}

export function viewportsForRisk(risk: Exclude<ChangeRisk, "none">): Viewport[] {
  const wanted = new Set(VIEWPORTS_BY_RISK[risk]);
  return VIEWPORTS.filter((viewport) => wanted.has(viewport.name));
}
