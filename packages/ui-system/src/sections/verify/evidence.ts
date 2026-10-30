import type { Page } from "@repo/contracts";
import { detectPlaybook } from "../playbook";
import { critique } from "./critique";
import { findRenderedSections } from "./markers";

export interface CheckEvidence {
  id: string;
  status: "passed" | "failed" | "not-executed";
  detail: string;
}

const NOT_EXECUTED: readonly CheckEvidence[] = [
  { id: "screenshots", status: "not-executed", detail: "Desktop and mobile screenshots were not captured." },
  { id: "overflow", status: "not-executed", detail: "Horizontal overflow was not measured in a browser." },
  { id: "interactions", status: "not-executed", detail: "Links and navigation were not clicked." },
  { id: "generated-build", status: "not-executed", detail: "A generated project build, typecheck, and lint were not run." },
];

function markerEvidence(pages: readonly Page[], html: string | undefined): CheckEvidence {
  if (html === undefined) {
    return { id: "section-markers", status: "not-executed", detail: "No rendered HTML was supplied." };
  }
  const ids = pages.flatMap((page) => (page.sections ?? []).map((section) => section.sectionId));
  const rendered = findRenderedSections(html, ids);
  if (rendered.missing.length === 0) {
    return { id: "section-markers", status: "passed", detail: "All supplied section markers are present." };
  }
  return { id: "section-markers", status: "failed", detail: `Missing ${rendered.missing.join(", ")}` };
}

export function compositionEvidence(pages: readonly Page[], html?: string): CheckEvidence[] {
  const pageChecks = pages.slice(0, 12).map((page): CheckEvidence => {
    const issues = critique(page.sections ?? [], detectPlaybook(page.purpose));
    return {
      id: `composition:${page.route}`,
      status: issues.length === 0 ? "passed" : "failed",
      detail: issues.length === 0 ? "Layout, surface, and hero order hold." : issues.join("; "),
    };
  });
  return [...pageChecks, ...NOT_EXECUTED, markerEvidence(pages, html)];
}
