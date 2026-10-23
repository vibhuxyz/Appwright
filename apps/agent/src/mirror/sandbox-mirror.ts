import { parsePorcelainZ, type PathChange } from "./changed-paths";

export const MAX_MIRROR_FILE_BYTES = 2_000_000;
export const MAX_PATHS_PER_SYNC = 300;
const IGNORED_SEGMENTS = ["node_modules", ".next", ".git"];

export interface SandboxMirrorPorts {
  listChanges(): Promise<string>;
  readSandboxFile(path: string): Promise<string>;
  writeHostFile(path: string, content: string): Promise<void>;
  removeHostFile(path: string): Promise<void>;
}

export interface SkippedPath {
  path: string;
  reason: string;
}

export interface SyncReport {
  written: string[];
  removed: string[];
  skipped: SkippedPath[];
}

function isIgnoredPath(path: string): boolean {
  return path.split("/").some((segment) => IGNORED_SEGMENTS.includes(segment));
}

function skipReasonFor(content: string): string | undefined {
  if (content.includes("\u0000")) return "binary content";
  if (Buffer.byteLength(content, "utf8") > MAX_MIRROR_FILE_BYTES) return `larger than ${MAX_MIRROR_FILE_BYTES} bytes`;
  return undefined;
}

export class SandboxMirror {
  private readonly lastMirrored = new Map<string, string>();

  constructor(private readonly ports: SandboxMirrorPorts) {}

  remember(path: string, content: string): void {
    this.lastMirrored.set(path, content);
  }

  async syncChanges(): Promise<SyncReport> {
    const report: SyncReport = { written: [], removed: [], skipped: [] };
    const changes = parsePorcelainZ(await this.ports.listChanges());
    const considered = changes.filter((change) => !isIgnoredPath(change.path));
    const batch = considered.slice(0, MAX_PATHS_PER_SYNC);
    for (const change of considered.slice(MAX_PATHS_PER_SYNC)) {
      report.skipped.push({ path: change.path, reason: `more than ${MAX_PATHS_PER_SYNC} changed paths in one sync` });
    }
    for (const change of batch) await this.applyChange(change, report);
    return report;
  }

  private async applyChange(change: PathChange, report: SyncReport): Promise<void> {
    if (change.kind === "delete") {
      this.lastMirrored.delete(change.path);
      await this.ports.removeHostFile(change.path);
      report.removed.push(change.path);
      return;
    }
    const content = await this.ports.readSandboxFile(change.path);
    const skipReason = skipReasonFor(content);
    if (skipReason) {
      report.skipped.push({ path: change.path, reason: skipReason });
      return;
    }
    if (this.lastMirrored.get(change.path) === content) return;
    await this.ports.writeHostFile(change.path, content);
    this.lastMirrored.set(change.path, content);
    report.written.push(change.path);
  }
}
