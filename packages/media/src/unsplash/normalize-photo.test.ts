import { describe, expect, it } from "bun:test";
import { rawPhoto } from "./fixtures";
import { normalizePhoto, normalizePhotos } from "./normalize-photo";

describe("normalizePhoto", () => {
  it("maps every field the asset model needs", () => {
    const photo = normalizePhoto(rawPhoto("abc"));
    expect(photo).toEqual({
      id: "abc",
      description: "a loaf of bread on a table",
      width: 4000,
      height: 2667,
      smallUrl: "https://images.unsplash.com/photo-abc?w=400",
      regularUrl: "https://images.unsplash.com/photo-abc?w=1080",
      downloadLocation: "https://api.unsplash.com/photos/abc/download?ixid=abc",
      attribution: {
        photographerName: "Ada Baker",
        photographerUrl: "https://unsplash.com/@adabaker?utm_source=appwright&utm_medium=referral",
        photoUrl: "https://unsplash.com/photos/abc?utm_source=appwright&utm_medium=referral",
      },
    });
  });

  it("prefers the description over the alt description", () => {
    expect(normalizePhoto(rawPhoto("a", { description: "  Warm   sourdough " }))?.description).toBe("Warm sourdough");
  });

  it("rejects a photo whose image is not served from Unsplash", () => {
    const hostile = rawPhoto("x", { urls: { small: "https://evil.example/a.jpg", regular: "https://evil.example/b.jpg" } });
    expect(normalizePhoto(hostile)).toBeNull();
  });

  it("rejects a photo without a download location", () => {
    expect(normalizePhoto(rawPhoto("y", { links: { html: "https://unsplash.com/photos/y" } }))).toBeNull();
  });
});

describe("normalizePhotos", () => {
  it("reports how many results it could not use", () => {
    const { photos, skipped } = normalizePhotos([rawPhoto("a"), { id: "broken" }, rawPhoto("b")]);
    expect(photos.map((photo) => photo.id)).toEqual(["a", "b"]);
    expect(skipped).toBe(1);
  });
});
