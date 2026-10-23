import { describe, expect, it } from "bun:test";
import { AssetSlotSchema, type AssetPurpose } from "@repo/contracts";
import { reusablePurposesIn, resolveReusableSlots, type ReusableAsset } from "../src/resolve-reusable-slots";

const base = {
  pageRoute: "/",
  componentName: "Logo",
  altText: "logo",
  suggestedPrompt: "a logo",
  status: "PENDING",
  assetId: null,
  required: true,
};

function slot(id: string, purpose: AssetPurpose, altText = base.altText) {
  return AssetSlotSchema.parse({ ...base, id, purpose, altText });
}

function asset(
  id: string,
  purpose: AssetPurpose,
  altText?: string,
): ReusableAsset {
  return { id, purpose, localPath: `/assets/${id}.png`, altText };
}

describe("reusablePurposesIn", () => {
  it("names every purpose on the request, deduplicated", () => {
    const purposes = reusablePurposesIn([
      slot("a", "logo"),
      slot("b", "icon"),
      slot("c", "logo"),
      slot("d", "hero"),
    ]);

    expect(purposes.sort()).toEqual(["hero", "icon", "logo"]);
  });
});

describe("resolveReusableSlots", () => {
  it("resolves a site-wide slot from an existing project asset", () => {
    const [resolved] = resolveReusableSlots([slot("a", "logo")], [asset("asset-1", "logo")]);

    expect(resolved).toMatchObject({
      status: "RESOLVED",
      assetId: "asset-1",
      finalPath: "/assets/asset-1.png",
    });
  });

  it("shares one site-wide asset across every slot of that purpose", () => {
    const resolved = resolveReusableSlots(
      [slot("a", "logo"), slot("b", "logo", "logo image on /menu: Menu")],
      [asset("asset-1", "logo")],
    );

    expect(resolved.map((slot) => slot.assetId)).toEqual(["asset-1", "asset-1"]);
  });

  it("leaves a slot pending when no reusable asset matches", () => {
    const [resolved] = resolveReusableSlots([slot("a", "icon")], []);

    expect(resolved).toMatchObject({ status: "PENDING", assetId: null });
  });

  it("reuses an uploaded hero for the matching section", () => {
    const [resolved] = resolveReusableSlots(
      [slot("a", "hero", "hero image on /: Home")],
      [asset("hero-1", "hero", "hero image on /: Home")],
    );

    expect(resolved).toMatchObject({ status: "RESOLVED", assetId: "hero-1" });
  });

  it("gives two photo slots two different uploads, matching alt text first", () => {
    const resolved = resolveReusableSlots(
      [
        slot("menu", "photo", "photo image on /menu: Menu"),
        slot("about", "photo", "photo image on /about: About"),
      ],
      [
        asset("about-file", "photo", "photo image on /about: About"),
        asset("menu-file", "photo", "photo image on /menu: Menu"),
      ],
    );

    expect(resolved.map((slot) => slot.assetId)).toEqual(["menu-file", "about-file"]);
  });

  it("leaves a photo slot pending when every upload of that purpose is already used", () => {
    const resolved = resolveReusableSlots(
      [slot("a", "photo", "one"), slot("b", "photo", "two")],
      [asset("only", "photo", "one")],
    );

    expect(resolved.map((slot) => slot.status)).toEqual(["RESOLVED", "PENDING"]);
  });

  it("carries the Unsplash credit and URL when a stock photo is reused", () => {
    const attribution = {
      photographerName: "Ada Baker",
      photographerUrl: "https://unsplash.com/@ada",
      photoUrl: "https://unsplash.com/photos/abc",
    };
    const stock: ReusableAsset = {
      id: "stock-1",
      purpose: "hero",
      localPath: "https://images.unsplash.com/photo-abc",
      altText: "hero",
      attribution,
    };
    const [resolved] = resolveReusableSlots([slot("a", "hero", "hero")], [stock]);

    expect(resolved).toMatchObject({ finalPath: stock.localPath, attribution });
  });

  it("does not mutate its input", () => {
    const slots = [slot("a", "logo")];
    resolveReusableSlots(slots, [asset("x", "logo")]);

    expect(slots[0]?.status).toBe("PENDING");
  });
});
