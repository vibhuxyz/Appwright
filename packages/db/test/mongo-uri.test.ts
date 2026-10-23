import { describe, expect, it } from "bun:test";
import { redactSecrets } from "../src/lib/mongo-redact";
import { scopedMongoUri } from "../src/lib/mongodb-uri";

describe("scopedMongoUri", () => {
  it("points the URI at the project database", () => {
    const uri = scopedMongoUri({
      adminUri: "mongodb://localhost:27017",
      databaseName: "app_abc_development",
    });
    expect(uri).toBe("mongodb://localhost:27017/app_abc_development");
  });

  it("embeds scoped credentials and authSource", () => {
    const uri = scopedMongoUri({
      adminUri: "mongodb://admin:cluster@localhost:27017/admin?authSource=admin",
      databaseName: "app_abc_development",
      username: "u_abc_dev",
      password: "s3cret",
    });
    const parsed = new URL(uri);
    expect(parsed.username).toBe("u_abc_dev");
    expect(parsed.password).toBe("s3cret");
    expect(parsed.pathname).toBe("/app_abc_development");
    expect(parsed.searchParams.get("authSource")).toBe("app_abc_development");
  });
});

describe("redactSecrets", () => {
  it("strips userinfo from MongoDB URIs", () => {
    const redacted = redactSecrets(
      "failed mongodb://u_abc:super-secret@localhost:27017/app_abc_development",
    );
    expect(redacted).not.toContain("super-secret");
    expect(redacted).toContain("mongodb://***@");
  });
});
