import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { decryptSecret, encryptSecret, prisma } from "@repo/db";
import { Router } from "express";
import { ownedProjectId } from "../auth";
import { PUBLIC_API_URL, WEB_APP_URL, requireEnv } from "../env";
import { workspacePath } from "../workspace/manager";

// Two routers, because they have different trust levels. The callback is
// called by Vercel with no session at all, so it is mounted *before* the
// app-wide auth wall and trusts only the signed state. Everything else sits
// behind the wall like every other route.
export const vercelRouter = Router();
export const vercelCallbackRouter = Router();

// D41: Appwright holds a revocable OAuth token, never a raw provider
// credential, and the connect moment is at Deploy — nothing during
// generation. This is the "external installation flow"
// (vercel.com/docs/integrations/create-integration/submit-integration
// #external-installation-flow): we send the user to Vercel's own consent
// screen, Vercel redirects back to VERCEL_REDIRECT_URI with a short-lived
// `code`, we exchange it server-side for a long-lived access token.
//
// The redirect URI is derived from PUBLIC_API_URL, not configured on its
// own. Vercel sends the *user's browser* there, so a localhost value lands
// on the user's own laptop and the flow dies silently. One public origin,
// one place to get it wrong.
const VERCEL_REDIRECT_URI = process.env.VERCEL_REDIRECT_URI ?? `${PUBLIC_API_URL}/vercel/callback`;

const STATE_TTL_MS = 10 * 60 * 1000;

// The state carries the *userId*, because the connection belongs to the
// person, not the app. It is HMAC-signed: Vercel hands it back to an
// unauthenticated callback, so the signature is the only thing standing
// between a stranger and "write my token into that user's account".
//
// The signed state is also why /vercel/connect is an authed POST returning a
// URL rather than a redirect the browser follows from an <a href> — a
// top-level navigation carries no Authorization header, so the userId has to
// be sealed into the state at the moment we still know who is asking.
function sign(payload: string): string {
  return createHmac("sha256", requireEnv("SECRETS_ENCRYPTION_KEY"))
    .update(`vercel-oauth-state:${payload}`)
    .digest("hex");
}

function makeState(userId: string, projectId: string): string {
  const payload = `${userId}.${projectId}.${Date.now()}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

function verifyState(state: string): { userId: string; projectId: string } | null {
  const parts = state.split(".");
  if (parts.length !== 5) return null;

  const [userId, projectId, issuedAt, nonce, signature] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];
  const expected = sign(`${userId}.${projectId}.${issuedAt}.${nonce}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > STATE_TTL_MS) return null;

  return { userId, projectId };
}

vercelRouter.post("/project/:id/vercel/connect", async (req, res) => {
  const projectId = await ownedProjectId(req.params.id, req.userId!);
  if (!projectId) return res.status(404).json({ error: "not found" });

  const slug = requireEnv("VERCEL_INTEGRATION_SLUG");
  const authorizeUrl = new URL(`https://vercel.com/integrations/${slug}/new`);
  authorizeUrl.searchParams.set("state", makeState(req.userId!, projectId));
  authorizeUrl.searchParams.set("next", `${WEB_APP_URL}/#/project/${projectId}`);

  res.json({ url: authorizeUrl.toString() });
});

vercelCallbackRouter.get("/vercel/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");
  const teamId = req.query.teamId ? String(req.query.teamId) : null;

  if (!code) return res.status(400).send("Missing code from Vercel callback.");

  const verified = verifyState(state);
  if (!verified) {
    return res.status(400).send("Invalid or expired state. Start the connect flow again.");
  }
  const { userId, projectId } = verified;

  const VERCEL_CLIENT_ID = requireEnv("VERCEL_CLIENT_ID");
  const VERCEL_CLIENT_SECRET = requireEnv("VERCEL_CLIENT_SECRET");

  const tokenRes = await fetch("https://api.vercel.com/v2/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: VERCEL_CLIENT_ID,
      client_secret: VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: VERCEL_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Vercel token exchange failed:", await tokenRes.text());
    return res.status(502).send("Could not connect to Vercel. Try again.");
  }

  const token = (await tokenRes.json()) as {
    access_token: string;
    team_id: string | null;
    installation_id?: string;
  };

  const configurationId = req.query.configurationId
    ? String(req.query.configurationId)
    : (token.installation_id ?? null);
  const effectiveTeamId = teamId ?? token.team_id;
  const encryptedToken = encryptSecret(token.access_token);

  // Upsert on userId: reconnecting replaces the token in place instead of
  // stacking a second row, and it is why the user is asked exactly once no
  // matter how many projects they later create.
  await prisma.vercelConnection.upsert({
    where: { userId },
    create: { userId, encryptedToken, teamId: effectiveTeamId, configurationId },
    update: { encryptedToken, teamId: effectiveTeamId, configurationId },
  });

  res.redirect(`${WEB_APP_URL}/#/project/${projectId}?vercel=connected`);
});

vercelRouter.get("/vercel/status", async (req, res) => {
  const connection = await prisma.vercelConnection.findUnique({
    where: { userId: req.userId! },
    select: { teamId: true, createdAt: true },
  });
  res.json({
    connected: !!connection,
    teamId: connection?.teamId ?? null,
    connectedAt: connection?.createdAt.toISOString() ?? null,
  });
});

vercelRouter.delete("/vercel/connection", async (req, res) => {
  await prisma.vercelConnection.deleteMany({ where: { userId: req.userId! } });
  res.status(204).end();
});

// Excludes match LocalRuntime's IGNORED_SEGMENTS (runtime.ts) plus the
// build-output dirs a fresh workspace never needs to ship.
const IGNORED_SEGMENTS = new Set(["node_modules", ".git", ".next", "dist", ".turbo"]);

async function collectDeployFiles(root: string): Promise<{ file: string; data: string; encoding: "base64" }[]> {
  const glob = new Bun.Glob("**/*");
  const files: { file: string; data: string; encoding: "base64" }[] = [];
  for await (const entry of glob.scan({ cwd: root, dot: false })) {
    if ([...IGNORED_SEGMENTS].some((seg) => entry === seg || entry.startsWith(`${seg}/`) || entry.includes(`/${seg}/`))) {
      continue;
    }
    const full = path.join(root, entry);
    const stat = await Bun.file(full).exists();
    if (!stat) continue;
    const bytes = await Bun.file(full).arrayBuffer();
    files.push({ file: entry, data: Buffer.from(bytes).toString("base64"), encoding: "base64" });
  }
  return files;
}

// Vercel rejects names that are empty, over 100 chars, contain `---`, or
// start/end with a hyphen. A raw `toLowerCase().replace()` produces all four
// from ordinary project names like "My App!" — a 400 the user reads as
// "deploy is broken".
//
// The id suffix is not decoration. `Project.name` has no unique constraint,
// so one user can own two projects called "Todo App"; without the suffix
// both slug to `todo-app` and the second deploy silently replaces the
// first's production site. A name is a label the user can retype. Identity
// has to come from something they cannot collide.
const NAME_SUFFIX_LENGTH = 6;
const MAX_VERCEL_NAME = 100;

export function deploymentName(name: string, projectId: string): string {
  const suffix = projectId.slice(-NAME_SUFFIX_LENGTH).toLowerCase();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_VERCEL_NAME - suffix.length - 1)
    .replace(/-$/, "");
  return slug ? `${slug}-${suffix}` : `app-${suffix}`;
}

// Vercel hands back two different kinds of URL and they answer different
// questions. `deployment.url` is immutable — `<name>-<hash>.vercel.app`,
// frozen to exactly the files in this one upload. The production *alias* is
// `<name>.vercel.app` and moves to the newest deployment once it builds.
//
// Returning only the first is why every deploy looked like it landed on a
// new site. Returning only the second is worse: for the first ~30s it still
// serves the *previous* build, so the user clicks it and sees no change.
// The UI needs both, labelled.
//
// A project has several aliases — the clean one, a `-<scope>` one, and
// per-branch `-git-<branch>-` ones. The shortest non-git alias is the one a
// human would type.
function pickAlias(aliases: (string | undefined)[] | undefined): string | null {
  const usable = (aliases ?? []).filter((a): a is string => !!a && !a.includes("-git-"));
  if (usable.length === 0) return null;
  return usable.reduce((best, a) => (a.length < best.length ? a : best));
}

// The deploy response carries `alias` for a production target, but not
// dependably on the very first deploy of a brand-new project — the alias is
// assigned as the project is created. Falling back to the project record
// covers that case instead of betting on which field is populated when.
async function productionAlias(
  deploymentAliases: string[] | undefined,
  vercelProjectId: string | null,
  accessToken: string,
  teamId: string | null,
): Promise<string | null> {
  const fromDeploy = pickAlias(deploymentAliases);
  if (fromDeploy) return fromDeploy;
  if (!vercelProjectId) return null;

  const url = new URL(`https://api.vercel.com/v9/projects/${vercelProjectId}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return null;

  const project = (await r.json()) as {
    alias?: { domain?: string }[];
    targets?: { production?: { alias?: string[] } };
  };
  return (
    pickAlias(project.targets?.production?.alias) ?? pickAlias(project.alias?.map((a) => a.domain))
  );
}

vercelRouter.post("/project/:id/deploy", async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!project) return res.status(404).json({ error: "not found" });

  // The connection is looked up by user, not by project — this is the whole
  // point of the change. Project #7 deploys on the token the user granted
  // when they connected before project #1.
  const connection = await prisma.vercelConnection.findUnique({ where: { userId: req.userId! } });
  if (!connection) {
    return res.status(400).json({ error: "Not connected to Vercel yet. Connect first." });
  }
  const accessToken = decryptSecret(connection.encryptedToken);
  const teamId = connection.teamId;

  const files = await collectDeployFiles(workspacePath(project.id));
  const framework = project.templateId === "nextjs-fullstack" ? "nextjs" : "vite";

  const deployUrl = new URL("https://api.vercel.com/v13/deployments");
  deployUrl.searchParams.set("forceNew", "1");
  deployUrl.searchParams.set("skipAutoDetectionConfirmation", "1");
  if (teamId) deployUrl.searchParams.set("teamId", teamId);

  // v13 requires `name` on every request — sending only `project` is a 400,
  // "missing required property `name`". `project` is an *additional*
  // targeting field that overrides `name` when both are present. Verified
  // against the live API: name + project lands in the project, not the name.
  // So always send the name, and add the recorded id when we have one.
  const derivedName = deploymentName(project.name, project.id);
  const post = (vercelProjectId: string | null) =>
    fetch(deployUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: derivedName,
        ...(vercelProjectId ? { project: vercelProjectId } : {}),
        files,
        target: "production",
        projectSettings: { framework },
      }),
    });

  let deployRes = await post(project.vercelProjectId);

  // The id we stored can stop existing — the user deletes the project in
  // Vercel's dashboard and ours still points at it. Retrying by name
  // recreates it instead of leaving Deploy permanently broken with a 404
  // about an id the user has never seen.
  if (!deployRes.ok && deployRes.status === 404 && project.vercelProjectId) {
    console.warn(`Vercel project ${project.vercelProjectId} is gone; recreating by name.`);
    await prisma.project.update({
      where: { id: project.id },
      data: { vercelProjectId: null },
    });
    project.vercelProjectId = null;
    deployRes = await post(null);
  }

  if (!deployRes.ok) {
    const body = await deployRes.text();
    console.error("Vercel deploy failed:", body);
    // Put Vercel's own message in `error`, because that is the field the UI
    // renders. Burying it in `detail` meant every failure — a bad payload, a
    // revoked token, a name clash — showed the user the same four useless
    // words, and the only way to learn anything was to read server logs.
    let message = "Vercel deploy failed";
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      if (parsed.error?.message) message = `Vercel: ${parsed.error.message}`;
    } catch {
      if (body) message = `Vercel deploy failed (${deployRes.status}): ${body.slice(0, 300)}`;
    }
    return res.status(502).json({ error: message, detail: body });
  }

  const deployment = (await deployRes.json()) as {
    url: string;
    readyState: string;
    id: string;
    projectId?: string;
    alias?: string[];
  };

  // Remember which Vercel project this app landed in. Without it, a rename
  // on our side changes the derived name and the next deploy silently
  // creates a *second* Vercel project instead of updating the first.
  if (deployment.projectId && deployment.projectId !== project.vercelProjectId) {
    await prisma.project.update({
      where: { id: project.id },
      data: { vercelProjectId: deployment.projectId },
    });
    project.vercelProjectId = deployment.projectId;
  }

  const alias = await productionAlias(
    deployment.alias,
    project.vercelProjectId,
    accessToken,
    teamId,
  );

  res.json({
    id: deployment.id,
    url: `https://${deployment.url}`,
    aliasUrl: alias ? `https://${alias}` : null,
    readyState: deployment.readyState,
  });
});

// The POST above returns while the build is still QUEUED or BUILDING —
// Vercel accepts the files and builds asynchronously. Without this route the
// user holds a snapshot that is already stale, which is the other half of
// "the URL shows the wrong app".
//
// The browser polls this rather than the API pushing over SSE: deploy events
// have nowhere to be persisted with a `seq` yet, and a client poll stops for
// free when the tab closes. The cost is that closing the tab mid-build loses
// the result — a persisted Deployment row is the real fix.
vercelRouter.get("/project/:id/deployment/:deploymentId", async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!project) return res.status(404).json({ error: "not found" });

  const connection = await prisma.vercelConnection.findUnique({ where: { userId: req.userId! } });
  if (!connection) return res.status(400).json({ error: "Not connected to Vercel." });

  const accessToken = decryptSecret(connection.encryptedToken);
  const url = new URL(`https://api.vercel.com/v13/deployments/${req.params.deploymentId}`);
  if (connection.teamId) url.searchParams.set("teamId", connection.teamId);

  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) {
    return res.status(502).json({ error: `Could not read deployment status (${r.status}).` });
  }

  const deployment = (await r.json()) as {
    url: string;
    readyState: string;
    alias?: string[];
    errorMessage?: string;
  };

  const alias = await productionAlias(
    deployment.alias,
    project.vercelProjectId,
    accessToken,
    connection.teamId,
  );

  res.json({
    id: req.params.deploymentId,
    url: `https://${deployment.url}`,
    aliasUrl: alias ? `https://${alias}` : null,
    readyState: deployment.readyState,
    errorMessage: deployment.errorMessage ?? null,
  });
});
