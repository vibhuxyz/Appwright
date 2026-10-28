import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { launchPlaywrightSession, runBrowserCheck, type Finding, type PageShot } from "@repo/browser";

export class BrowserSetupError extends Error {}
export class AppFailedError extends Error {}

export interface SiteCapture {
  readonly shots: readonly PageShot[];
  readonly findings: readonly Finding[];
  readonly viewports: readonly string[];
  readonly notes: readonly string[];
}

export async function captureSite(input: { workspaceDir: string; shotsDir: string }): Promise<SiteCapture> {
  const reportDir = path.join(input.workspaceDir, ".browser-report");
  const check = await runBrowserCheck({
    workspaceDir: input.workspaceDir,
    outputDir: reportDir,
    launchSession: () => launchPlaywrightSession(),
  });
  if (check.status === "skipped") throw new BrowserSetupError(`Browser capture could not start: ${check.reason}`);
  if (check.status === "app-failed") throw new AppFailedError(`The generated app did not start: ${check.reason}`);
  await mkdir(input.shotsDir, { recursive: true });
  await Promise.all(
    check.report.pageShots.map(async (shot) => {
      const target = path.join(input.shotsDir, shot.file.replaceAll("/", "__"));
      await copyFile(path.join(reportDir, shot.file), target);
    }),
  );
  return { shots: check.report.pageShots, findings: check.report.findings, viewports: check.viewports, notes: check.report.notes };
}
