import { describe, expect, it } from "bun:test";
import { MongoClient } from "mongodb";
import { ScopedProjectDb, toProjectDatabaseName } from "../src/lib/project-db";

const TEST_URI = "mongodb://localhost:27017";

function scopedDbFor(projectId: string): ScopedProjectDb {
  const client = new MongoClient(TEST_URI);
  const db = client.db(toProjectDatabaseName(projectId));
  return new ScopedProjectDb(db);
}

describe("toProjectDatabaseName", () => {
  it("prefixes a valid projectId into its own database name", () => {
    expect(toProjectDatabaseName("abc123")).toBe("proj_abc123");
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
});

describe("ScopedProjectDb isolation", () => {
  it("scopes two projects to two distinct database names", () => {
    const dbA = scopedDbFor("projecta1");
    const dbB = scopedDbFor("projectb2");

    const collectionA = dbA.collection("items");
    const collectionB = dbB.collection("items");

    expect(collectionA.dbName).toBe("proj_projecta1");
    expect(collectionB.dbName).toBe("proj_projectb2");
    expect(collectionA.dbName).not.toBe(collectionB.dbName);
  });

  it("does not expose the underlying client, so a handle cannot reach another project's database", () => {
    const db = scopedDbFor("onlythisproject");
    expect(Object.keys(db)).toEqual(["db"]);
    expect("client" in db).toBe(false);
  });
});
