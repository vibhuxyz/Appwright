import type { Runtime } from "./runtime";

export interface VerifyResult {
  ok: boolean;
  output: string;
}

// The gap this closes: the loop's own "verify your work" prompt rule asks
// the model to re-read files and self-report — which catches nothing when
// the file is syntactically broken (a duplicated block, an unclosed tag).
// Re-reading isn't checking. `tsc --noEmit` actually is, and on this
// template it runs in well under a second — cheap enough to run after every
// turn. Not full V4-grade verification (no runtime/test checks), just the
// first real check instead of none.
// vite-react splits config into tsconfig.app.json + tsconfig.node.json —
// tsconfig.json there is a references-only stub with no `files`, so tsc
// needs pointing at tsconfig.app.json directly. Other templates (e.g.
// nextjs-fullstack) use one plain tsconfig.json.
async function resolveTsconfig(runtime: Runtime): Promise<string> {
  try {
    await runtime.readFile("tsconfig.app.json");
    return "tsconfig.app.json";
  } catch {
    return "tsconfig.json";
  }
}

export async function verifyTypeScript(
  runtime: Runtime,
): Promise<VerifyResult> {
  const tsconfig = await resolveTsconfig(runtime);
  const result = await runtime.exec(
    ["bunx", "tsc", "--noEmit", "-p", tsconfig],
    {
      timeoutMs: 30_000,
    },
  );

  if (result.exitCode === 0) {
    return { ok: true, output: "" };
  }

  return { ok: false, output: (result.stdout + result.stderr).trim() };
}
