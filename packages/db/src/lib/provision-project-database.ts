import { randomBytes } from "node:crypto";
import { Prisma } from "../../generated/prisma/client";
import { encryptSecret } from "./crypto";
import { getMongoAdmin, mongoErrorDetail, type MongoAdmin } from "./mongo-admin";
import { scopedMongoUri } from "./mongodb-uri";
import { prisma } from "./prisma";
import {
  ProjectDatabaseError,
} from "./project-database-errors";
import {
  toProjectDatabaseName,
  toProjectDatabaseUsername,
  type ProjectDbEnvironment,
} from "./project-db";

const SECRET_KEY_PREFIX = "mongodb.uri.";
const STALE_PROVISION_MS = 60_000;
const WAIT_READY_ATTEMPTS = 10;
const WAIT_READY_MS = 200;
const MONGO_ATTEMPTS = 3;
const DEFAULT_QUOTA = 50;
const META_MIGRATION_VERSION = 1;

export interface ProvisionProjectDatabaseInput {
  projectId: string;
  environment: ProjectDbEnvironment;
  actorUserId: string;
}

export interface ProvisionProjectDatabaseResult {
  projectId: string;
  environment: ProjectDbEnvironment;
  databaseName: string;
  status: "ready";
  isolationMode: "scoped-user" | "shared-cluster-user";
  migrationVersion: number;
}

export interface ProvisionDeps {
  mongo?: MongoAdmin;
  now?: () => Date;
}

type PrismaEnv = "DEVELOPMENT" | "PREVIEW" | "PRODUCTION";
type PrismaIsolation = "SCOPED_USER" | "SHARED_CLUSTER_USER";

function toPrismaEnv(environment: ProjectDbEnvironment): PrismaEnv {
  if (environment === "development") return "DEVELOPMENT";
  if (environment === "preview") return "PREVIEW";
  return "PRODUCTION";
}

function fromPrismaEnv(environment: PrismaEnv): ProjectDbEnvironment {
  if (environment === "DEVELOPMENT") return "development";
  if (environment === "PREVIEW") return "preview";
  return "production";
}

function fromPrismaIsolation(
  isolation: PrismaIsolation,
): "scoped-user" | "shared-cluster-user" {
  return isolation === "SCOPED_USER" ? "scoped-user" : "shared-cluster-user";
}

function secretKey(environment: ProjectDbEnvironment): string {
  return `${SECRET_KEY_PREFIX}${environment}`;
}

function quotaLimit(): number {
  const raw = process.env.MAX_PROJECT_DATABASES_PER_USER;
  if (!raw) return DEFAULT_QUOTA;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_QUOTA;
}

function allowSharedFallback(): boolean {
  if (process.env.MONGODB_REQUIRE_SCOPED_USERS === "true") return false;
  if (process.env.MONGODB_REQUIRE_SCOPED_USERS === "false") return true;
  return process.env.NODE_ENV !== "production";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

async function withMongoRetries<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 1; attempt <= MONGO_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (attempt === MONGO_ATTEMPTS) break;
      await sleep(50 * 2 ** (attempt - 1));
    }
  }
  throw last;
}

function readyResult(row: {
  projectId: string;
  environment: PrismaEnv;
  databaseName: string;
  isolationMode: PrismaIsolation;
  migrationVersion: number;
}): ProvisionProjectDatabaseResult {
  return {
    projectId: row.projectId,
    environment: fromPrismaEnv(row.environment),
    databaseName: row.databaseName,
    status: "ready",
    isolationMode: fromPrismaIsolation(row.isolationMode),
    migrationVersion: row.migrationVersion,
  };
}

export async function provisionProjectDatabase(
  input: ProvisionProjectDatabaseInput,
  deps: ProvisionDeps = {},
): Promise<ProvisionProjectDatabaseResult> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId: input.actorUserId },
    select: { id: true, userId: true, templateId: true },
  });
  if (!project) throw ProjectDatabaseError.notFound();
  if (project.templateId !== "nextjs-fullstack") {
    throw ProjectDatabaseError.notDatabaseBacked();
  }

  const prismaEnv = toPrismaEnv(input.environment);
  const databaseName = toProjectDatabaseName(project.id, input.environment);
  const username = toProjectDatabaseUsername(project.id, input.environment);
  const now = deps.now ?? (() => new Date());

  const existing = await prisma.projectDatabase.findUnique({
    where: {
      projectId_environment: { projectId: project.id, environment: prismaEnv },
    },
  });
  if (existing?.status === "READY") return readyResult(existing);

  const ownedCount = await prisma.projectDatabase.count({
    where: {
      project: { userId: project.userId },
      status: { not: "PENDING_DELETE" },
    },
  });
  if (!existing && ownedCount >= quotaLimit()) {
    throw ProjectDatabaseError.quotaExceeded(quotaLimit());
  }

  let row = existing;
  if (!row) {
    try {
      row = await prisma.projectDatabase.create({
        data: {
          projectId: project.id,
          environment: prismaEnv,
          provider: "MONGODB",
          databaseName,
          isolationMode: "SHARED_CLUSTER_USER",
          status: "PROVISIONING",
        },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      const raced = await prisma.projectDatabase.findUnique({
        where: {
          projectId_environment: {
            projectId: project.id,
            environment: prismaEnv,
          },
        },
      });
      if (!raced) throw err;
      if (raced.status === "READY") return readyResult(raced);
      if (raced.status === "PROVISIONING") {
        const age = now().getTime() - raced.updatedAt.getTime();
        if (age < STALE_PROVISION_MS) {
          const waited = await waitForReady(project.id, prismaEnv);
          if (waited) return readyResult(waited);
        }
      }
      row = raced;
    }
  }

  row = await prisma.projectDatabase.update({
    where: { id: row.id },
    data: {
      status: "PROVISIONING",
      databaseName,
      lastErrorCode: null,
      retryCount: { increment: row.status === "FAILED" ? 1 : 0 },
    },
  });

  try {
    const mongo = deps.mongo ?? getMongoAdmin();
    const password = randomBytes(32).toString("base64url");

    await withMongoRetries(() =>
      mongo.initializeDatabase(databaseName, {
        projectId: project.id,
        environment: input.environment,
        provider: "mongodb",
      }),
    );

    const userResult = await withMongoRetries(() =>
      mongo.ensureScopedUser({ databaseName, username, password }),
    );

    let isolation: PrismaIsolation = "SCOPED_USER";
    let runtimeUri: string;
    if (userResult === "unsupported") {
      if (!allowSharedFallback()) {
        throw ProjectDatabaseError.scopedUsersRequired();
      }
      isolation = "SHARED_CLUSTER_USER";
      runtimeUri = scopedMongoUri({
        adminUri: mongo.adminUri,
        databaseName,
      });
    } else {
      runtimeUri = scopedMongoUri({
        adminUri: mongo.adminUri,
        databaseName,
        username,
        password,
      });
    }

    const encryptedValue = encryptSecret(runtimeUri);
    const secret = await prisma.secret.upsert({
      where: {
        projectId_key: { projectId: project.id, key: secretKey(input.environment) },
      },
      create: {
        projectId: project.id,
        key: secretKey(input.environment),
        encryptedValue,
      },
      update: { encryptedValue },
    });

    const ready = await prisma.projectDatabase.update({
      where: { id: row.id },
      data: {
        status: "READY",
        isolationMode: isolation,
        secretRef: String(secret.id),
        migrationVersion: META_MIGRATION_VERSION,
        lastErrorCode: null,
        databaseName,
      },
    });
    return readyResult(ready);
  } catch (err) {
    const code =
      err instanceof ProjectDatabaseError ? err.code : "PROVISION_FAILED";
    const detail =
      err instanceof ProjectDatabaseError
        ? err.message
        : `Provisioning failed: ${mongoErrorDetail(err)}`;
    await prisma.projectDatabase
      .update({
        where: { id: row.id },
        data: { status: "FAILED", lastErrorCode: code },
      })
      .catch(() => undefined);
    if (err instanceof ProjectDatabaseError) throw err;
    if (/ECONNREFUSED|server selection|MongoNetwork|ENOTFOUND/i.test(String(err))) {
      throw ProjectDatabaseError.mongoUnavailable(mongoErrorDetail(err));
    }
    throw ProjectDatabaseError.failed(detail);
  }
}

async function waitForReady(projectId: string, environment: PrismaEnv) {
  for (let i = 0; i < WAIT_READY_ATTEMPTS; i++) {
    const row = await prisma.projectDatabase.findUnique({
      where: { projectId_environment: { projectId, environment } },
    });
    if (row?.status === "READY") return row;
    if (row?.status === "FAILED") return null;
    await sleep(WAIT_READY_MS);
  }
  return null;
}

export { secretKey as projectDatabaseSecretKey };
