import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DesignSkillId, LoadedSkill } from "../skills";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../skills");

export async function loadSkills(ids: readonly DesignSkillId[]): Promise<LoadedSkill[]> {
  return Promise.all(
    ids.map(async (id) => ({ id, body: await readFile(path.join(SKILLS_DIR, `${id}.md`), "utf8") })),
  );
}
