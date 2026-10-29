import { HANDOFF_PATH } from "./constants";

export function isHandoffPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/").replace(/^\.?\//, "");
  return normalized === HANDOFF_PATH;
}
