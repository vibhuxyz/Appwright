export interface SupervisorConfig {
  port: number;
  sandboxRoot: string;
  leaseDurationMs?: number;
}

export interface SupervisorInstance {
  port: number;
  baseUrl: string;
  stop: () => Promise<void>;
}
