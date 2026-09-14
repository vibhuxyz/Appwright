#!/usr/bin/env bun
// bun run scripts/health-check.ts
// Hits /health on every service that has one and prints ok/fail. Reads the
// same URL the rest of the repo already uses (PUBLIC_API_URL) so this never
// drifts from the real dev/prod endpoint on its own.

interface Target {
  name: string;
  url: string;
}

const targets: Target[] = [
  {
    name: "api",
    url: `${process.env.PUBLIC_API_URL ?? "http://localhost:3001"}/health`,
  },
];

let failed = 0;

for (const target of targets) {
  const start = performance.now();
  try {
    const res = await fetch(target.url, { signal: AbortSignal.timeout(3000) });
    const ms = Math.round(performance.now() - start);
    if (res.ok) {
      console.log(`ok    ${target.name.padEnd(20)} ${ms}ms`);
    } else {
      console.log(`fail  ${target.name.padEnd(20)} HTTP ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(
      `fail  ${target.name.padEnd(20)} ${err instanceof Error ? err.message : String(err)}`,
    );
    failed++;
  }
}

if (failed > 0) process.exit(1);
