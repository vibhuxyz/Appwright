import { describe, expect, it } from "bun:test";
import { shouldSyncKey } from "../src/routes/vercel-sync";

describe("Vercel environment synchronization", () => {
  it("never syncs Appwrite platform or internal secrets", () => {
    expect(shouldSyncKey("APPWRITE_MANAGED_BREVO_API_KEY", "brevo", true)).toBe(false);
    expect(shouldSyncKey("APPWRITE_INTERNAL_SIGNING_KEY", "brevo", true)).toBe(false);
  });

  it("syncs only the selected project-owned email provider credentials", () => {
    expect(shouldSyncKey("BREVO_API_KEY", "brevo", true)).toBe(true);
    expect(shouldSyncKey("RESEND_API_KEY", "brevo", true)).toBe(false);
    expect(shouldSyncKey("BREVO_API_KEY", "brevo", false)).toBe(false);
  });
});
