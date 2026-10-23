import { describe, expect, it } from "bun:test";
import type { ElementSelection } from "@repo/contracts";
import { rankCandidates } from "./rank-candidates";

const SELECTION: ElementSelection = {
  route: "/",
  tag: "section",
  text: "Our best sellers this week",
  classes: "grid gap-4 rounded-xl bg-white p-6",
  selector: "main > section:nth-of-type(2)",
  html: "<section>Our best sellers this week</section>",
};

const FILES = [
  { path: "src/app/page.tsx", content: "export default function P(){return <div/>}\n" },
  {
    path: "src/components/BestSellers.tsx",
    content:
      "export function BestSellers() {\n  return (\n    <section className=\"grid gap-4 rounded-xl bg-white p-6\">\n      <h2>Our best sellers this week</h2>\n    </section>\n  );\n}\n",
  },
  { path: "src/components/Footer.tsx", content: "<footer className=\"p-6\">bye</footer>" },
];

describe("rankCandidates", () => {
  it("ranks the file containing the text and classes first, with its line", () => {
    const ranked = rankCandidates(FILES, SELECTION);
    expect(ranked[0]?.path).toBe("src/components/BestSellers.tsx");
    expect(ranked[0]?.line).toBe(4);
    expect(ranked.map((c) => c.path)).not.toContain("src/app/page.tsx");
  });

  it("returns nothing when nothing matches", () => {
    const ranked = rankCandidates(FILES, { ...SELECTION, text: "", classes: "zzz-unknown" });
    expect(ranked).toEqual([]);
  });
});
