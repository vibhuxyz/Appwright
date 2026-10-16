import {
  DEFAULT_EXEC_TIMEOUT_MS,
  EXEC_ROUTE,
  FILE_READ_ROUTE,
  FILE_WRITE_ROUTE,
  GIT_CLONE_ROUTE,
  GIT_COMMIT_ROUTE,
  GIT_PUSH_ROUTE,
  HEALTH_ROUTE,
} from "../contract/constants";
import type {
  ExecRequest,
  ExecResponse,
  FileReadResponse,
  FileWriteResponse,
  GitCloneRequest,
  GitCommitRequest,
  GitPushRequest,
  GitResponse,
  HealthResponse,
} from "../contract/types";
import type { Sandbox } from "./types";

export class SandboxClient implements Sandbox {
  constructor(
    public readonly id: string,
    public readonly baseUrl: string,
  ) {}

  private async request<T>(
    endpoint: string,
    options: {
      method: "GET" | "POST";
      body?: unknown;
      timeoutMs?: number;
    },
  ): Promise<T> {
    const timeout = options.timeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options.method,
        headers: { "Content-Type": "application/json" },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      const data = (await response.json()) as T | { error?: { message?: string } };

      if (!response.ok) {
        const errorMsg =
          typeof data === "object" && data !== null && "error" in data
            ? data.error?.message ?? "Sandbox error"
            : `HTTP ${response.status}`;
        throw new Error(`[Sandbox ${this.id}] ${errorMsg}`);
      }

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async exec(req: ExecRequest): Promise<ExecResponse> {
    return this.request<ExecResponse>(EXEC_ROUTE, {
      method: "POST",
      body: req,
      timeoutMs: (req.timeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS) + 5000,
    });
  }

  async readFile(path: string): Promise<FileReadResponse> {
    return this.request<FileReadResponse>(FILE_READ_ROUTE, {
      method: "POST",
      body: { path },
    });
  }

  async writeFile(path: string, content: string): Promise<FileWriteResponse> {
    return this.request<FileWriteResponse>(FILE_WRITE_ROUTE, {
      method: "POST",
      body: { path, content },
    });
  }

  async gitClone(req: GitCloneRequest): Promise<GitResponse> {
    return this.request<GitResponse>(GIT_CLONE_ROUTE, {
      method: "POST",
      body: req,
    });
  }

  async gitCommit(req: GitCommitRequest): Promise<GitResponse> {
    return this.request<GitResponse>(GIT_COMMIT_ROUTE, {
      method: "POST",
      body: req,
    });
  }

  async gitPush(req: GitPushRequest): Promise<GitResponse> {
    return this.request<GitResponse>(GIT_PUSH_ROUTE, {
      method: "POST",
      body: req,
    });
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>(HEALTH_ROUTE, {
      method: "GET",
      timeoutMs: 5000,
    });
  }

  async snapshot(): Promise<string> {
    const res = await this.exec({
      argv: ["git", "rev-parse", "HEAD"],
    });
    return res.code === 0 ? res.stdout.trim() : "snapshot-initial";
  }

  async exposePort(port: number): Promise<string> {
    return `http://localhost:${port}`;
  }
}
