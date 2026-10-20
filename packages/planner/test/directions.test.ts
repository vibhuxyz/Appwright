import { describe, expect, it } from "bun:test";
import { generateDesignDirections } from "../src";

describe("generateDesignDirections", () => {
  it("emits 2-3 directions with exactly one marked default", () => {
    const directions = generateDesignDirections("build a crm app");
    expect(directions.length).toBeGreaterThanOrEqual(2);
    expect(directions.length).toBeLessThanOrEqual(3);

    const defaultCount = directions.filter((d) => d.isDefault).length;
    expect(defaultCount).toBe(1);
  });

  it("includes preview palettes and layout descriptions", () => {
    const directions = generateDesignDirections("build a food delivery app", undefined, {
      primaryColor: "#E23744",
    });

    const defaultDir = directions.find((d) => d.isDefault);
    expect(defaultDir).toBeDefined();
    expect(defaultDir?.design.primaryColor).toBe("#E23744");
    expect(defaultDir?.preview.colorPalette.primary).toBe("#E23744");
    expect(defaultDir?.layout.mobileNavigation).toBeDefined();
  });
});
