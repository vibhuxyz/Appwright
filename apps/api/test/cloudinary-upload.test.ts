import { describe, expect, it } from "bun:test";
import { matchesImageType, uploadFolder } from "../src/routes/integrations/runtime";

describe("Cloudinary upload validation", () => {
  it("accepts supported image signatures that match the declared MIME type", () => {
    expect(matchesImageType(Buffer.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(matchesImageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")).toBe(true);
    expect(matchesImageType(Buffer.from("RIFF1234WEBP"), "image/webp")).toBe(true);
  });

  it("rejects mismatched and unsupported image types", () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(matchesImageType(png, "image/jpeg")).toBe(false);
    expect(matchesImageType(png, "image/gif")).toBe(false);
    expect(matchesImageType(Buffer.from("RIFF1234WAVE"), "image/webp")).toBe(false);
  });
});

describe("uploadFolder", () => {
  it("keeps Appwright test-key uploads apart from platform and BYOK folders", () => {
    expect(uploadFolder({ projectId: "p1", environment: "development", credentialMode: "APPWRITE_MANAGED" }))
      .toBe("appwright-apps/p1/development");
    expect(uploadFolder({ projectId: "p1", environment: "development", credentialMode: "BYOK" }))
      .toBe("appwright/p1");
  });
});
