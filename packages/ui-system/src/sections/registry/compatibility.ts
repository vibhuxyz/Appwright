import type { SectionEntry } from "./types";

export const GENERATED_STACK = {
  reactMajor: 19,
  nextMajor: 16,
  tailwindMajor: 4,
  framework: "next",
  styling: "tailwind",
  note: "templates/nextjs-fullstack uses tailwindcss ^4, Next 16.3.1, and React 19.2.8. Tailwind 3.4.17 is not the generated stack and was not installed.",
} as const;

export function isStackCompatible(section: Pick<SectionEntry, "tailwindMajor" | "reactMajor">): boolean {
  return section.tailwindMajor === GENERATED_STACK.tailwindMajor && section.reactMajor === GENERATED_STACK.reactMajor;
}
