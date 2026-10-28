import { MAX_SKILL_BYTES, MAX_SKILLS_BYTES, SKILLS_CLOSE_TAG, SKILLS_OPEN_TAG } from "./constants";
import type { DesignSkillId, LoadedSkill, SkillsBlock } from "./types";

const ELLIPSIS = "\n…";

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

function cutToBytes(text: string, maxBytes: number): string {
  if (byteLength(text) <= maxBytes) return text;
  const limit = maxBytes - byteLength(ELLIPSIS);
  let end = Math.min(text.length, limit);
  while (end > 0 && byteLength(text.slice(0, end)) > limit) end -= 1;
  return `${text.slice(0, end)}${ELLIPSIS}`;
}

function escapeClosing(body: string): string {
  return body.replaceAll(SKILLS_CLOSE_TAG, "<\\/design-skills>");
}

export function formatSkills(skills: readonly LoadedSkill[]): SkillsBlock {
  const parts: string[] = [];
  const included: DesignSkillId[] = [];
  const cut: { id: DesignSkillId; reason: string }[] = [];
  let usedBytes = 0;
  for (const skill of skills) {
    const body = cutToBytes(escapeClosing(skill.body.trim()), MAX_SKILL_BYTES);
    if (body !== escapeClosing(skill.body.trim())) cut.push({ id: skill.id, reason: `trimmed to ${MAX_SKILL_BYTES} bytes` });
    const size = byteLength(body);
    if (usedBytes + size > MAX_SKILLS_BYTES) {
      cut.push({ id: skill.id, reason: `left out: block budget ${MAX_SKILLS_BYTES} bytes reached` });
      continue;
    }
    usedBytes += size;
    parts.push(body);
    included.push(skill.id);
  }
  if (parts.length === 0) return { text: "", included, cut };
  return { text: [SKILLS_OPEN_TAG, ...parts, SKILLS_CLOSE_TAG].join("\n\n"), included, cut };
}
