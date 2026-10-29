import { describe, expect, it } from "bun:test";
import { isRepairPrompt } from "@repo/contracts";

describe("repair prompts", () => {
  it("treats a preview failure as a fix, not a new site", () => {
    const prompt =
      '{"error":{"code":"BAD_GATEWAY","message":"preview server unreachable"}} fix why getting this why app is not starting';
    expect(isRepairPrompt(prompt)).toBe(true);
  });

  it("does not treat a new app request as a fix", () => {
    expect(isRepairPrompt("build a bakery website with a menu")).toBe(false);
  });

  it("treats a pasted hydration error as a fix, including the word fixing", () => {
    const prompt = `Console Error

A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.

src/components/SiteHeader.tsx (62:13)

why getting this ? insted of fixing ?`;
    expect(isRepairPrompt(prompt)).toBe(true);
  });
});
