import { afterAll, describe, expect, it } from "bun:test";
import {
  decryptSecret,
  prisma,
  provisionProjectDatabase,
  scheduleProjectDatabaseDeletions,
  reapDueDatabaseDeletions,
  getProjectRuntimeMongoUri,
  ProjectDatabaseError,
  type MongoAdmin,
} from "../src/index";

process.env.SECRETS_ENCRYPTION_KEY ??= "test-secrets-encryption-key-32b!";

function skipIfNoPostgres(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const code =
    typeof err === "object" && err && "code" in err ? String(err.code) : "";
  return (
    code === "ECONNREFUSED" ||
    message.includes("ECONNREFUSED") ||
    message.includes("Can't reach database server")
  );
}

function fakeMongo(opts?: {
  failTimes?: number;
  userResult?: "created" | "updated" | "unsupported";
}): MongoAdmin & { initCount: number; names: string[] } {
  let failures = opts?.failTimes ?? 0;
  const names: string[] = [];
  return {
    adminUri: "mongodb://localhost:27017",
    initCount: 0,
    names,
    async initializeDatabase(databaseName) {
      if (failures > 0) {
        failures -= 1;
        throw new Error("mongo unavailable mongodb://admin:cluster-secret@localhost:27017");
      }
      this.initCount += 1;
      names.push(databaseName);
    },
    async databaseExists(databaseName) {
      return names.includes(databaseName);
    },
    async ensureScopedUser() {
      return opts?.userResult ?? "created";
    },
    async dropUser() {},
    async dropDatabase(databaseName) {
      const idx = names.indexOf(databaseName);
      if (idx >= 0) names.splice(idx, 1);
    },
  };
}

describe("provisionProjectDatabase", () => {
  const ids: { userId: string; projectIds: string[] } = {
    userId: "",
    projectIds: [],
  };

  afterAll(async () => {
    if (ids.projectIds.length > 0) {
      await prisma.project
        .deleteMany({ where: { id: { in: ids.projectIds } } })
        .catch(() => {});
    }
    if (ids.userId) {
      await prisma.user.delete({ where: { id: ids.userId } }).catch(() => {});
    }
  });

  async function seed(templateId = "nextjs-fullstack") {
    const user =
      ids.userId !== ""
        ? await prisma.user.findUniqueOrThrow({ where: { id: ids.userId } })
        : await prisma.user.create({
            data: {
              email: `db-prov-${Date.now()}@example.com`,
              hashPassword: "test-hash",
            },
          });
    ids.userId = user.id;
    const project = await prisma.project.create({
      data: {
        name: "db-app",
        templateId,
        workspacePath: "/tmp/unused",
        userId: user.id,
      },
    });
    ids.projectIds.push(project.id);
    return { user, project };
  }

  it("assigns a stable per-project database and is idempotent", async () => {
    try {
      const { user, project } = await seed();
      const mongo = fakeMongo();
      const first = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo },
      );
      const second = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo },
      );
      expect(first.databaseName).toBe(`app_${project.id}_d`);
      expect(second.databaseName).toBe(first.databaseName);
      expect(first.status).toBe("ready");
      expect(mongo.initCount).toBe(1);
      const uri = await getProjectRuntimeMongoUri({
        projectId: project.id,
        environment: "development",
      });
      expect(uri).toContain(first.databaseName);
      expect(uri).toContain("mongodb://");
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("gives two projects different database names", async () => {
    try {
      const a = await seed();
      const b = await seed();
      const mongo = fakeMongo();
      const first = await provisionProjectDatabase(
        {
          projectId: a.project.id,
          environment: "development",
          actorUserId: a.user.id,
        },
        { mongo },
      );
      const second = await provisionProjectDatabase(
        {
          projectId: b.project.id,
          environment: "development",
          actorUserId: b.user.id,
        },
        { mongo },
      );
      expect(first.databaseName).not.toBe(second.databaseName);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("isolates development and production databases", async () => {
    try {
      const { user, project } = await seed();
      const mongo = fakeMongo();
      const dev = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo },
      );
      const prod = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "production",
          actorUserId: user.id,
        },
        { mongo },
      );
      expect(dev.databaseName).not.toBe(prod.databaseName);
      expect(prod.databaseName).toBe(`app_${project.id}_p`);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("handles concurrent provisioners via the unique registry", async () => {
    try {
      const { user, project } = await seed();
      const mongo = fakeMongo();
      const [left, right] = await Promise.all([
        provisionProjectDatabase(
          {
            projectId: project.id,
            environment: "preview",
            actorUserId: user.id,
          },
          { mongo },
        ),
        provisionProjectDatabase(
          {
            projectId: project.id,
            environment: "preview",
            actorUserId: user.id,
          },
          { mongo },
        ),
      ]);
      expect(left.databaseName).toBe(right.databaseName);
      const count = await prisma.projectDatabase.count({
        where: { projectId: project.id, environment: "PREVIEW" },
      });
      expect(count).toBe(1);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("does not mark ready when Mongo initialization fails, and recovers on retry", async () => {
    try {
      const { user, project } = await seed();
      const failing = fakeMongo({ failTimes: 3 });
      let failed: unknown;
      try {
        await provisionProjectDatabase(
          {
            projectId: project.id,
            environment: "development",
            actorUserId: user.id,
          },
          { mongo: failing },
        );
      } catch (err) {
        failed = err;
      }
      expect(failed).toBeInstanceOf(ProjectDatabaseError);
      const row = await prisma.projectDatabase.findFirst({
        where: { projectId: project.id, environment: "DEVELOPMENT" },
      });
      expect(row?.status).toBe("FAILED");
      expect(row?.lastErrorCode).toBeTruthy();
      await expect(
        getProjectRuntimeMongoUri({
          projectId: project.id,
          environment: "development",
        }),
      ).rejects.toBeInstanceOf(ProjectDatabaseError);

      const recovered = fakeMongo();
      const result = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo: recovered },
      );
      expect(result.status).toBe("ready");
      expect(result.databaseName).toBe(`app_${project.id}_d`);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("rewrites a stored name that exceeds Atlas's 38-byte limit on retry", async () => {
    try {
      const { user, project } = await seed();
      const staleName = `app_${project.id}_development`;
      expect(new TextEncoder().encode(staleName).length).toBeGreaterThan(38);
      await prisma.projectDatabase.create({
        data: {
          projectId: project.id,
          environment: "DEVELOPMENT",
          provider: "MONGODB",
          databaseName: staleName,
          isolationMode: "SHARED_CLUSTER_USER",
          status: "FAILED",
          lastErrorCode: "PROVISION_FAILED",
        },
      });
      const mongo = fakeMongo();
      const result = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo },
      );
      expect(result.status).toBe("ready");
      expect(result.databaseName).toBe(`app_${project.id}_d`);
      expect(new TextEncoder().encode(result.databaseName).length).toBeLessThanOrEqual(
        38,
      );
      expect(mongo.names).toEqual([result.databaseName]);
      const row = await prisma.projectDatabase.findFirst({
        where: { projectId: project.id, environment: "DEVELOPMENT" },
      });
      expect(row?.databaseName).toBe(result.databaseName);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("does not leak cluster secrets into stored error codes", async () => {
    try {
      const { user, project } = await seed();
      const failing = fakeMongo({ failTimes: 3 });
      await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo: failing },
      ).catch(() => undefined);
      const row = await prisma.projectDatabase.findFirst({
        where: { projectId: project.id, environment: "DEVELOPMENT" },
      });
      expect(row?.lastErrorCode).not.toContain("cluster-secret");
      expect(JSON.stringify(row)).not.toContain("mongodb://");
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("rejects a caller who does not own the project", async () => {
    try {
      const { project } = await seed();
      const stranger = await prisma.user.create({
        data: {
          email: `db-stranger-${Date.now()}@example.com`,
          hashPassword: "test-hash",
        },
      });
      try {
        await expect(
          provisionProjectDatabase(
            {
              projectId: project.id,
              environment: "development",
              actorUserId: stranger.id,
            },
            { mongo: fakeMongo() },
          ),
        ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND", httpStatus: 404 });
      } finally {
        await prisma.user.delete({ where: { id: stranger.id } });
      }
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("encrypts the runtime URI in Secret, not in the registry", async () => {
    try {
      const { user, project } = await seed();
      await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo: fakeMongo() },
      );
      const row = await prisma.projectDatabase.findFirstOrThrow({
        where: { projectId: project.id, environment: "DEVELOPMENT" },
      });
      expect(row.secretRef).toBeTruthy();
      expect(JSON.stringify(row)).not.toContain("mongodb://");
      const secret = await prisma.secret.findFirstOrThrow({
        where: { projectId: project.id, key: "mongodb.uri.development" },
      });
      expect(secret.encryptedValue).not.toContain("mongodb://");
      const uri = decryptSecret(secret.encryptedValue);
      expect(uri.startsWith("mongodb://")).toBe(true);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("does not provision a database for vite-react projects", async () => {
    try {
      const { user, project } = await seed("vite-react");
      await expect(
        provisionProjectDatabase(
          {
            projectId: project.id,
            environment: "development",
            actorUserId: user.id,
          },
          { mongo: fakeMongo() },
        ),
      ).rejects.toMatchObject({ code: "NOT_DATABASE_BACKED" });
      const count = await prisma.projectDatabase.count({
        where: { projectId: project.id },
      });
      expect(count).toBe(0);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("records shared-cluster-user when scoped users are unsupported", async () => {
    try {
      const { user, project } = await seed();
      const previous = process.env.MONGODB_REQUIRE_SCOPED_USERS;
      process.env.MONGODB_REQUIRE_SCOPED_USERS = "false";
      try {
        const result = await provisionProjectDatabase(
          {
            projectId: project.id,
            environment: "development",
            actorUserId: user.id,
          },
          { mongo: fakeMongo({ userResult: "unsupported" }) },
        );
        expect(result.isolationMode).toBe("shared-cluster-user");
      } finally {
        if (previous === undefined) delete process.env.MONGODB_REQUIRE_SCOPED_USERS;
        else process.env.MONGODB_REQUIRE_SCOPED_USERS = previous;
      }
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });

  it("schedules deletion instead of dropping immediately", async () => {
    try {
      const { user, project } = await seed();
      const mongo = fakeMongo();
      const result = await provisionProjectDatabase(
        {
          projectId: project.id,
          environment: "development",
          actorUserId: user.id,
        },
        { mongo },
      );
      const scheduled = await scheduleProjectDatabaseDeletions(project.id);
      expect(scheduled).toBe(1);
      expect(mongo.names).toContain(result.databaseName);
      await reapDueDatabaseDeletions({
        mongo,
        now: () => new Date(Date.now() - 1000),
      });
      expect(mongo.names).toContain(result.databaseName);
      await reapDueDatabaseDeletions({
        mongo,
        now: () => new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      });
      expect(mongo.names).not.toContain(result.databaseName);
    } catch (err) {
      if (skipIfNoPostgres(err)) return;
      throw err;
    }
  });
});
