import type { QualityCheck, SectionDraft, SectionEntry } from "./types";

const ACCESSIBILITY = [
  "One heading labels the section",
  "Body text meets 4.5:1 on its surface",
  "Controls show a visible focus ring",
  "Motion follows prefers-reduced-motion",
] as const;

const CHECKS: readonly QualityCheck[] = [
  {
    id: "license",
    status: "passed",
    detail: "Original Appwright section. No third-party source was copied.",
  },
  {
    id: "stack",
    status: "passed",
    detail: "React 19, Next.js, and Tailwind 4 semantic tokens. No new packages.",
  },
  {
    id: "isolated-browser",
    status: "not-executed",
    detail: "Not rendered in an isolated browser project.",
  },
  {
    id: "screenshots",
    status: "not-executed",
    detail: "Desktop and mobile screenshots were not captured.",
  },
];

export function accepted(draft: SectionDraft): SectionEntry {
  return {
    ...draft,
    businesses: draft.businesses ?? [],
    primitives: draft.primitives ?? ["Button"],
    assets: draft.assets ?? [],
    sourceId: "appwright-original",
    variantId: draft.layoutPattern,
    quality: "accepted",
    tailwindMajor: 4,
    reactMajor: 19,
    accessibility: ACCESSIBILITY,
    checks: CHECKS,
  };
}
