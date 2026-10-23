import { afterEach, describe, expect, it } from "bun:test";
import { clearMongoEnvCache, loadMongoEnv } from "../src/lib/mongo-env";

const ORIGINAL_DEDICATED = process.env.MONGO_DB_PROJECT_DATABASE;
const ORIGINAL_LEGACY = process.env.MONGODB_URI;

afterEach(() => {
  clearMongoEnvCache();
  if (ORIGINAL_DEDICATED === undefined) delete process.env.MONGO_DB_PROJECT_DATABASE;
  else process.env.MONGO_DB_PROJECT_DATABASE = ORIGINAL_DEDICATED;
  if (ORIGINAL_LEGACY === undefined) delete process.env.MONGODB_URI;
  else process.env.MONGODB_URI = ORIGINAL_LEGACY;
});

describe("loadMongoEnv", () => {
  it("reads MONGO_DB_PROJECT_DATABASE as the shared project-database cluster", () => {
    process.env.MONGO_DB_PROJECT_DATABASE = "mongodb://cluster.example:27017";
    process.env.MONGODB_URI = "mongodb://legacy.example:27017";
    expect(loadMongoEnv().MONGO_DB_PROJECT_DATABASE).toBe(
      "mongodb://cluster.example:27017",
    );
  });

  it("falls back to MONGODB_URI when the dedicated cluster var is unset", () => {
    delete process.env.MONGO_DB_PROJECT_DATABASE;
    process.env.MONGODB_URI = "mongodb://localhost:27017";
    expect(loadMongoEnv().MONGO_DB_PROJECT_DATABASE).toBe(
      "mongodb://localhost:27017",
    );
  });

  it("rejects a missing cluster URI", () => {
    delete process.env.MONGO_DB_PROJECT_DATABASE;
    delete process.env.MONGODB_URI;
    expect(() => loadMongoEnv()).toThrow(/MONGO_DB_PROJECT_DATABASE/);
  });
});
