import { completed, fileContains, maxCostUsd, typechecks } from "../graders";
import type { EvalCase } from "../core/types";

export const nextjsCases: readonly EvalCase[] = [
  {
    id: "next-about-page",
    template: "nextjs-fullstack",
    prompt: "Add an /about page with a heading 'About us' and one paragraph describing the product.",
    tags: ["smoke", "routing"],
    graders: [
      completed,
      typechecks,
      fileContains("src/app/about/page.tsx", /About us/),
      maxCostUsd(0.3),
    ],
  },
] as const;
