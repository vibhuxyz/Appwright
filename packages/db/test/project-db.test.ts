import { describe, expect, it } from "bun:test";
import { MongoClient } from "mongodb";
import {
  ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES,
  ScopedProjectDb,
  toProjectDatabaseName,
  toProjectDatabaseUsername,
} from "../src/lib/project-db";

const TEST_URI = "mongodb://localhost:27017";

function scopedDbFor(projectId: string): ScopedProjectDb {
  const client = new MongoClient(TEST_URI);
  const db = client.db(toProjectDatabaseName(projectId, "development"));
  return new ScopedProjectDb(db);
}

describe("toProjectDatabaseName", () => {
  it("prefixes a valid projectId into its own database name per environment", () => {
    expect(toProjectDatabaseName("abc123", "development")).toBe("app_abc123_d");
    expect(toProjectDatabaseName("abc123", "preview")).toBe("app_abc123_v");
    expect(toProjectDatabaseName("abc123", "production")).toBe("app_abc123_p");
  });

  it("fits Atlas shared-tier 38-byte names for a real cuid and a max-length projectId", () => {
    const cuid = "cmvk098jr0000vwnnp92wpbcz";
    expect(cuid.length).toBe(25);
    for (const environment of ["development", "preview", "production"] as const) {
      const name = toProjectDatabaseName(cuid, environment);
      expect(new TextEncoder().encode(name).length).toBeLessThanOrEqual(
        ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES,
      );
    }
    const maxId = "a".repeat(30);
    const longest = toProjectDatabaseName(maxId, "development");
    expect(new TextEncoder().encode(longest).length).toBeLessThanOrEqual(
      ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES,
    );
    expect(new TextEncoder().encode(`app_${cuid}_development`).length).toBeGreaterThan(
      ATLAS_SHARED_TIER_DB_NAME_MAX_BYTES,
    );
  });

  it("rejects projectIds that could escape the namespace", () => {
    const invalidIds = ["", "a.b", "a$b", "a/b", "a b", "../other", "A1"];
    for (const projectId of invalidIds) {
      expect(() => toProjectDatabaseName(projectId)).toThrow();
    }
  });

  it("rejects projectIds over the length limit", () => {
    expect(() => toProjectDatabaseName("a".repeat(31))).toThrow();
  });

  it("gives two projects different names", () => {
    expect(toProjectDatabaseName("projecta1")).not.toBe(
      toProjectDatabaseName("projectb2"),
    );
  });
});

describe("toProjectDatabaseUsername", () => {
  it("derives a stable per-environment username", () => {
    expect(toProjectDatabaseUsername("abc123", "development")).toBe(
      "u_abc123_dev",
    );
    expect(toProjectDatabaseUsername("abc123", "production")).toBe(
      "u_abc123_prod",
    );
  });
});

describe("ScopedProjectDb isolation", () => {
  it("scopes two projects to two distinct database names", () => {
    const dbA = scopedDbFor("projecta1");
    const dbB = scopedDbFor("projectb2");

    const collectionA = dbA.collection("items");
    const collectionB = dbB.collection("items");

    expect(collectionA.dbName).toBe("app_projecta1_d");
    expect(collectionB.dbName).toBe("app_projectb2_d");
    expect(collectionA.dbName).not.toBe(collectionB.dbName);
  });

  it("does not expose the underlying client, so a handle cannot reach another project's database", () => {
    const db = scopedDbFor("onlythisproject");
    expect(Object.keys(db)).toEqual(["db"]);
    expect("client" in db).toBe(false);
  });
});
