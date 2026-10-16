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
} from "../contract";

export interface Sandbox {
  readonly id: string;
  readonly baseUrl: string;
  exec(req: ExecRequest): Promise<ExecResponse>;
  readFile(path: string): Promise<FileReadResponse>;
  writeFile(path: string, content: string): Promise<FileWriteResponse>;
  gitClone(req: GitCloneRequest): Promise<GitResponse>;
  gitCommit(req: GitCommitRequest): Promise<GitResponse>;
  gitPush(req: GitPushRequest): Promise<GitResponse>;
  checkHealth(): Promise<HealthResponse>;
  snapshot(): Promise<string>;
  exposePort(port: number): Promise<string>;
}
