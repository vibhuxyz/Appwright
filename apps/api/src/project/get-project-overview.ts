import type { ProjectOverviewResponse } from "@repo/contracts";
import { listProjectPaths } from "@repo/contracts/files";
import { prisma } from "@repo/db";
import { getRecentCommits } from "@repo/tools";
import { getDevServerPort, projectRepoPath } from "../workspace/manager";

interface ActivityItem {
  id: string;
  type: "project" | "database" | "session" | "asset" | "commit" | "deployment";
  title: string;
  desc: string;
  timestamp: string;
}

function resolveOverallHealth(
  dbStatus: string | null,
  isDevRunning: boolean,
): "healthy" | "degraded" | "provisioning" {
  if (dbStatus === "FAILED") return "degraded";
  if (dbStatus === "PENDING" || dbStatus === "PROVISIONING") return "provisioning";
  if (!isDevRunning) return "healthy";
  return "healthy";
}

export async function getProjectOverview(
  projectId: string,
  userId: string,
): Promise<ProjectOverviewResponse | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      sessions: {
        include: {
          messages: { select: { id: true, createdAt: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      databases: true,
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) return null;

  const repoDir = projectRepoPath(projectId);
  const [paths, recentCommits] = await Promise.all([
    listProjectPaths(projectId).catch(() => []),
    getRecentCommits(repoDir, 5),
  ]);

  const devPort = getDevServerPort(project.id);
  const isDevRunning = Boolean(devPort);
  const devUrl = devPort ? `http://localhost:${devPort}` : null;

  const totalTokens = project.sessions.reduce(
    (acc, s) => acc + s.tokenIn + s.tokenOut,
    0,
  );
  const totalCostUsd = project.sessions.reduce((acc, s) => acc + s.cost, 0);
  const messageCount = project.sessions.reduce(
    (acc, s) => acc + s.messages.length,
    0,
  );

  const primaryDb = project.databases[0] ?? null;
  const dbStatus = primaryDb ? primaryDb.status : null;

  const activities: ActivityItem[] = [
    {
      id: `proj-${project.id}`,
      type: "project",
      title: "Project created",
      desc: `${project.name} (${project.templateId})`,
      timestamp: project.createdAt.toISOString(),
    },
  ];

  for (const db of project.databases) {
    activities.push({
      id: `db-${db.id}`,
      type: "database",
      title: `Database ${db.status.toLowerCase()}`,
      desc: `MongoDB: ${db.databaseName}`,
      timestamp: db.updatedAt.toISOString(),
    });
  }

  for (const session of project.sessions.slice(0, 4)) {
    activities.push({
      id: `sess-${session.id}`,
      type: "session",
      title: "Agent session",
      desc: `${session.title ?? "Interactive session"} (${session.model})`,
      timestamp: session.createdAt.toISOString(),
    });
  }

  for (const asset of project.assets.slice(0, 4)) {
    activities.push({
      id: `asset-${asset.id}`,
      type: "asset",
      title: "Asset added",
      desc: `${asset.purpose} (${asset.source})`,
      timestamp: asset.createdAt.toISOString(),
    });
  }

  for (const commit of recentCommits) {
    activities.push({
      id: `commit-${commit.sha}`,
      type: "commit",
      title: "Git commit",
      desc: `${commit.message} (${commit.shortSha})`,
      timestamp: commit.date,
    });
  }

  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    projectId: project.id,
    projectName: project.name,
    templateId: project.templateId,
    status: project.status,
    previewUrl: devUrl,
    metrics: {
      fileCount: paths.length,
      sessionCount: project.sessions.length,
      messageCount,
      totalTokens,
      totalCostUsd,
      assetCount: project.assets.length,
    },
    database: primaryDb
      ? {
          status: primaryDb.status,
          databaseName: primaryDb.databaseName,
          environment: primaryDb.environment,
          provider: primaryDb.provider,
        }
      : null,
    health: {
      devServer: {
        running: isDevRunning,
        port: devPort ?? null,
        url: devUrl,
      },
      database: {
        status: dbStatus ?? "NOT_CONFIGURED",
        name: primaryDb?.databaseName ?? null,
      },
      overallStatus: resolveOverallHealth(dbStatus, isDevRunning),
    },
    recentCommits,
    recentActivity: activities.slice(0, 10),
  };
}
