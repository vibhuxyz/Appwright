import { describe, expect, it } from "bun:test";
import { UnsplashPhoto } from "@repo/contracts";
import { hasLegibleText } from "../src/assets/unsplash/legible-text";
import { pickUnusedPhoto } from "../src/assets/unsplash/pick-unused-photo";

function photo(id: string, slug: string, description: string | null): UnsplashPhoto {
  return UnsplashPhoto.parse({
    id,
    description,
    width: 4000,
    height: 2667,
    smallUrl: `https://images.unsplash.com/photo-${id}?w=400`,
    regularUrl: `https://images.unsplash.com/photo-${id}?w=1080`,
    downloadLocation: `https://api.unsplash.com/photos/${id}/download?ixid=1`,
    attribution: {
      photographerName: "Ada Baker",
      photographerUrl: "https://unsplash.com/@adabaker?utm_source=appwright&utm_medium=referral",
      photoUrl: `https://unsplash.com/photos/${slug}?utm_source=appwright&utm_medium=referral`,
    },
  });
}

const RECRUITER = photo("a1", "linkedin-recruiter-hire-candidates-faster-with-robust-tool-pVhI8a4suXE", null);
const DASHBOARD = photo("a2", "a-laptop-showing-a-website-dashboard-Xq3Lm9PzAbc", "A laptop screen showing a website dashboard");
const ENGINEER = photo("a3", "woman-working-in-a-lab-Zk4Nn8RtUvw", "Engineer working in a lab");
const BREAD = photo("a4", "fresh-bread-on-a-wooden-table-Bb2Cc3DdEef", "Fresh bread");

describe("hasLegibleText", () => {
  it("flags photos whose description or slug names UI or brand text", () => {
    expect(hasLegibleText(RECRUITER)).toBe(true);
    expect(hasLegibleText(DASHBOARD)).toBe(true);
  });

  it("keeps ordinary scenes, and ignores the random id at the end of the slug", () => {
    expect(hasLegibleText(ENGINEER)).toBe(false);
    expect(hasLegibleText(BREAD)).toBe(false);
    expect(hasLegibleText(photo("a5", "red-chair-in-a-room-UiXx12Qqweb", null))).toBe(false);
  });
});

describe("pickUnusedPhoto", () => {
  it("skips used and legible-text photos and returns the first clean one", () => {
    expect(pickUnusedPhoto([RECRUITER, DASHBOARD, ENGINEER, BREAD], new Set(["a3"]))?.id).toBe("a4");
  });

  it("returns nothing when every candidate is rejected", () => {
    expect(pickUnusedPhoto([RECRUITER, DASHBOARD], new Set())).toBeUndefined();
  });
});
