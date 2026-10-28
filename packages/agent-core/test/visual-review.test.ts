import { describe, expect, it } from "bun:test";
import { FakeProvider } from "../src/providers/fake";
import { reviewScreenshots, type ReviewShot } from "../src/visual-review";

const VALID = JSON.stringify({
  scores: { hierarchy: 4, layout: 3, typography: 4, imagery: 2, spacing: 3, composition: 3, color: 3, rhythm: 4, distinctiveness: 2, mobile: 3 },
  issues: [{ route: "/", viewport: "mobile", severity: "severe", area: "hero", problem: "Headline overlaps the image caption", fix: "Stack the caption under the headline below md" }],
});

function shots(count: number): ReviewShot[] {
  return Array.from({ length: count }, (_unused, index) => ({
    route: "/",
    viewport: index % 2 === 0 ? "desktop" : "mobile",
    png: new Uint8Array([137, 80, 78, 71]),
  }));
}

describe("reviewScreenshots", () => {
  it("parses a valid review and records the model and prompt version", async () => {
    const result = await reviewScreenshots({ shots: shots(2), provider: new FakeProvider([{ kind: "text", text: VALID }]) });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.review.issues[0]?.severity).toBe("severe");
    expect(result.promptVersion).toBe("visual-review@2");
    expect(result.reviewed).toHaveLength(2);
  });

  it("repairs one invalid reply, then succeeds", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: "Looks great overall!" },
      { kind: "text", text: `\`\`\`json\n${VALID}\n\`\`\`` },
    ]);
    const result = await reviewScreenshots({ shots: shots(1), provider });
    expect(result.ok).toBe(true);
  });

  it("returns a typed failure after two invalid replies", async () => {
    const provider = new FakeProvider([
      { kind: "text", text: "{}" },
      { kind: "text", text: '{"scores":{}}' },
    ]);
    const result = await reviewScreenshots({ shots: shots(1), provider });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("invalid JSON twice");
  });

  it("reviews at most four screenshots and reports the rest as skipped", async () => {
    const result = await reviewScreenshots({ shots: shots(6), provider: new FakeProvider([{ kind: "text", text: VALID }]) });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reviewed).toHaveLength(4);
    expect(result.skipped).toHaveLength(2);
  });

  it("turns a provider failure into a reason instead of throwing", async () => {
    const result = await reviewScreenshots({ shots: shots(1), provider: new FakeProvider([]) });
    expect(result).toEqual({ ok: false, reason: "Visual review unavailable: FakeProvider: script exhausted" });
  });
});
