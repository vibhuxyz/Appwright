import { describe, expect, it } from "bun:test";
import { AssetSlotSchema, UnsplashPhoto } from "@repo/contracts";
import { reasonFor } from "../src/assets/claim-slot";
import { applySlotOutcome } from "../src/assets/mark-slot-resolved";
import { serializeProjectAsset } from "../src/assets/serialize";
import { buildUnsplashAssetData, orientationForAspect, pickUnusedPhoto } from "../src/assets/unsplash";

const PHOTO = UnsplashPhoto.parse({
  id: "abc123",
  description: "Fresh bread",
  width: 4000,
  height: 2667,
  smallUrl: "https://images.unsplash.com/photo-abc123?w=400",
  regularUrl: "https://images.unsplash.com/photo-abc123?w=1080",
  downloadLocation: "https://api.unsplash.com/photos/abc123/download?ixid=1",
  attribution: {
    photographerName: "Ada Baker",
    photographerUrl: "https://unsplash.com/@adabaker?utm_source=appwright&utm_medium=referral",
    photoUrl: "https://unsplash.com/photos/abc123?utm_source=appwright&utm_medium=referral",
  },
});

const SLOT = AssetSlotSchema.parse({
  id: "/:Hero:0",
  pageRoute: "/",
  componentName: "Hero",
  purpose: "hero",
  altText: "Fresh bread on a table",
  suggestedPrompt: "bread",
  status: "GENERATING",
});

describe("buildUnsplashAssetData", () => {
  const data = buildUnsplashAssetData({
    projectId: "p1",
    sessionId: "s1",
    purpose: "hero",
    altText: SLOT.altText,
    searchText: "bread",
    photo: PHOTO,
  });

  it("records the provider photo id, source and photographer credit", () => {
    expect(data).toMatchObject({
      source: "SEARCHED",
      externalId: "abc123",
      attribution: PHOTO.attribution,
      purpose: "hero",
      sessionId: "s1",
    });
  });

  it("points every image field at the hotlinked Unsplash URL and nothing is rehosted", () => {
    expect(data.localPath).toBe(PHOTO.regularUrl);
    expect(data.cloudinaryUrl).toBe(PHOTO.regularUrl);
    expect(data.cloudinaryPublicId).toBe("unsplash:abc123");
  });
});

describe("selection persistence", () => {
  it("keeps the photo URL and credit on the resolved slot", () => {
    const [slot] = applySlotOutcome([SLOT], {
      assetRequestId: "r1",
      slotId: SLOT.id,
      status: "RESOLVED",
      assetId: "asset1",
      finalPath: PHOTO.regularUrl,
      attribution: PHOTO.attribution,
    });
    expect(slot).toMatchObject({ status: "RESOLVED", finalPath: PHOTO.regularUrl, attribution: PHOTO.attribution });
  });

  it("drops the old credit when the slot is filled by something else", () => {
    const [slot] = applySlotOutcome([{ ...SLOT, attribution: PHOTO.attribution }], {
      assetRequestId: "r1",
      slotId: SLOT.id,
      status: "RESOLVED",
      assetId: "asset2",
      finalPath: "/assets/hero/own.png",
    });
    expect(slot?.attribution).toBeUndefined();
  });

  it("returns the credit when the asset is listed", () => {
    const row = {
      id: "asset1",
      projectId: "p1",
      sessionId: "s1",
      purpose: "hero",
      source: "SEARCHED",
      prompt: "bread",
      cloudinaryUrl: PHOTO.regularUrl,
      localPath: PHOTO.regularUrl,
      altText: SLOT.altText,
      externalId: "abc123",
      attribution: PHOTO.attribution,
      createdAt: new Date("2026-10-24T00:00:00Z"),
    };
    expect(serializeProjectAsset(row)).toMatchObject({ externalId: "abc123", attribution: PHOTO.attribution });
    expect(serializeProjectAsset({ ...row, externalId: null, attribution: null }).attribution).toBeNull();
  });
});

describe("replacing a photo", () => {
  it("lets a resolved slot be claimed only in replace mode", () => {
    const resolved = { ...SLOT, status: "RESOLVED" } as const;
    expect(reasonFor(resolved, "first-fill")).toBe("ALREADY_RESOLVED");
    expect(reasonFor(resolved, "replace")).toBeUndefined();
  });

  it("never claims a slot that is being resolved", () => {
    expect(reasonFor({ ...SLOT, status: "UPLOADING" }, "replace")).toBe("IN_PROGRESS");
    expect(reasonFor({ ...SLOT, status: "GENERATING" }, "first-fill")).toBe("IN_PROGRESS");
  });
});

describe("automatic suggestions", () => {
  it("skips photos that another slot already uses", () => {
    const second = { ...PHOTO, id: "second" };
    expect(pickUnusedPhoto([PHOTO, second], new Set(["abc123"]))?.id).toBe("second");
    expect(pickUnusedPhoto([PHOTO], new Set(["abc123"]))).toBeUndefined();
  });

  it("asks for the orientation that matches the slot's aspect ratio", () => {
    expect(orientationForAspect("16:9")).toBe("landscape");
    expect(orientationForAspect("3:4")).toBe("portrait");
    expect(orientationForAspect("1:1")).toBe("squarish");
    expect(orientationForAspect("wide")).toBeUndefined();
    expect(orientationForAspect(undefined)).toBeUndefined();
  });
});
