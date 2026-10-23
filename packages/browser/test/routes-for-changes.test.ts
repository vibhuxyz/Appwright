import { describe, expect, it } from "bun:test";
import { routesForChanges } from "../src/routes";

const PAGES = [
  "src/app/page.tsx",
  "src/app/menu/page.tsx",
  "src/app/reviews/page.tsx",
  "src/app/about/page.tsx",
];

describe("routesForChanges", () => {
  it("opens only the pages this change edited", () => {
    expect(routesForChanges(["src/app/menu/page.tsx", "src/app/menu/Hero.tsx"], PAGES)).toEqual(["/menu"]);
  });

  it("checks the home page when a shared component changed", () => {
    expect(routesForChanges(["src/components/SiteHeader.tsx"], PAGES)).toEqual(["/"]);
  });

  it("opens nothing when the prompt did not change the app", () => {
    expect(routesForChanges(["README.md"], PAGES)).toEqual([]);
    expect(routesForChanges([], PAGES)).toEqual([]);
  });
});
