import { describe, expect, it } from "bun:test";
import { intakeAction, isRepairPrompt } from "../src/intake";

describe("repair prompts", () => {
  it("treats a preview failure as a fix, not a new site", () => {
    const prompt =
      '{"error":{"code":"BAD_GATEWAY","message":"preview server unreachable"}} fix why getting this why app is not starting';
    expect(isRepairPrompt(prompt)).toBe(true);
    expect(intakeAction({ prompt, isFollowUp: false, planInDetail: true })).toBe("send");
  });

  it("still plans a new app", () => {
    const prompt = "build a bakery website with a menu";
    expect(isRepairPrompt(prompt)).toBe(false);
    expect(intakeAction({ prompt, isFollowUp: false, planInDetail: true })).toBe("plan");
  });

  it("sends a follow-up on a project that already has a plan", () => {
    expect(intakeAction({ prompt: "change the header", isFollowUp: true, planInDetail: true })).toBe("send");
  });

  it("sends a small tweak without opening a plan", () => {
    expect(intakeAction({ prompt: "make the button blue", isFollowUp: false, planInDetail: false })).toBe("send");
  });

  it("treats a pasted hydration error as a fix, including the word fixing", () => {
    const prompt = `Console Error

A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.

src/components/SiteHeader.tsx (62:13)

why getting this ? insted of fixing ?`;
    expect(isRepairPrompt(prompt)).toBe(true);
    expect(intakeAction({ prompt, isFollowUp: false, planInDetail: true })).toBe("send");
  });
});
