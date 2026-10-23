import { describe, expect, it } from "bun:test";
import { discoverRoutes, MAX_ROUTES } from "../src/routes";

describe("discoverRoutes", () => {
  it("maps page files to routes and drops route groups", () => {
    const { routes } = discoverRoutes([
      "src/app/page.tsx",
      "src/app/menu/page.tsx",
      "src/app/(shop)/cart/page.tsx",
      "src/app/layout.tsx",
    ]);
    expect(routes).toEqual(["/", "/cart", "/menu"]);
  });

  it("reports dynamic, API and private segments as skipped with a reason", () => {
    const { routes, skipped } = discoverRoutes([
      "src/app/page.tsx",
      "src/app/blog/[slug]/page.tsx",
      "src/app/api/orders/page.tsx",
      "src/app/_internal/page.tsx",
    ]);
    expect(routes).toEqual(["/"]);
    expect(skipped.map((entry) => entry.path)).toEqual([
      "src/app/_internal/page.tsx",
      "src/app/api/orders/page.tsx",
      "src/app/blog/[slug]/page.tsx",
    ]);
    expect(skipped.every((entry) => entry.reason.length > 0)).toBe(true);
  });

  it("caps the route list and reports what was cut", () => {
    const files = Array.from({ length: MAX_ROUTES + 3 }, (_, index) => `src/app/p${String(index).padStart(2, "0")}/page.tsx`);
    const { routes, skipped } = discoverRoutes(files);
    expect(routes).toHaveLength(MAX_ROUTES);
    expect(skipped).toHaveLength(3);
  });

  it("returns the same routes regardless of input order", () => {
    const files = ["src/app/b/page.tsx", "src/app/a/page.tsx", "src/app/page.tsx"];
    expect(discoverRoutes(files).routes).toEqual(discoverRoutes([...files].reverse()).routes);
  });
});
