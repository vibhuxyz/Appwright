// Bundled once per process and cached: every E2BSandboxProvider.create()
// call after the first reuses the same bundle text instead of re-running
// the bundler.
let cachedBundle: string | undefined;

export async function getSupervisorBundle(): Promise<string> {
  if (cachedBundle) return cachedBundle;

  const entry = new URL("../supervisor/bootstrap-entry.ts", import.meta.url);
  const result = await Bun.build({
    entrypoints: [entry.pathname],
    target: "node",
    format: "esm",
  });

  if (!result.success) {
    const messages = result.logs.map((l) => l.message).join("; ");
    throw new Error(`Failed to bundle sandbox supervisor for E2B: ${messages}`);
  }

  const [output] = result.outputs;
  if (!output) {
    throw new Error("Supervisor bundle produced no output");
  }

  cachedBundle = await output.text();
  return cachedBundle;
}
