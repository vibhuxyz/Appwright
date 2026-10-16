import { E2BSandboxProvider } from "./e2b-provider";
import { LocalSandboxProvider } from "./local-provider";
import type { SandboxProvider } from "./types";

// D22's swap-by-config promise, kept: the caller never names a concrete
// provider class, only this function and the env var that picks one.
export function createSandboxProviderFromEnv(): SandboxProvider {
  const kind = process.env.SANDBOX_PROVIDER ?? "local";
  if (kind === "e2b") return new E2BSandboxProvider();
  if (kind === "local") return new LocalSandboxProvider();
  throw new Error(`Unknown SANDBOX_PROVIDER: ${kind} (expected "local" or "e2b")`);
}
