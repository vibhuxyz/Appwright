import { truncate, type Runtime } from "@repo/agent-core";
import { z } from "zod";
import allowlist from "../deps.allow.json";
import { wrapUntrusted } from "./untrusted";

export const bashArgs = z.object({
  argv: z.array(z.string()).min(1),
  timeoutMs: z.number().int().positive().default(30_000),
});

const INSTALL_COMMANDS = new Set(["install", "add", "i"]);

// D24 — the agent may not install packages it invented. Parse the argv,
// reject anything not on deps.allow.json, always force --ignore-scripts.
export function guardBashArgv(argv: string[]): string[] {
  const [bin, sub, ...rest] = argv;
  const isPackageManager = bin === "npm" || bin === "bun" || bin === "pnpm";
  if (!isPackageManager || !sub || !INSTALL_COMMANDS.has(sub)) return argv;

  const packages = rest.filter((arg) => !arg.startsWith("-"));
  const notAllowed = packages.filter(
    (pkg) => !allowlist.packages.includes(pkg),
  );
  if (notAllowed.length > 0) {
    throw new Error(
      `Package(s) not in deps.allow.json: ${notAllowed.join(", ")}`,
    );
  }

  // Force --ignore-scripts even if the model didn't ask for it — a
  // hallucinated-but-allowlisted package can still ship a malicious
  // postinstall.
  return argv.includes("--ignore-scripts")
    ? argv
    : [...argv, "--ignore-scripts"];
}

export async function execBash(
  args: z.infer<typeof bashArgs>,
  runtime: Runtime,
): Promise<string> {
  const argv = guardBashArgv(args.argv);
  const result = await runtime.exec(argv, { timeoutMs: args.timeoutMs });

  const body = [
    `$ ${args.argv.join(" ")}`,
    `exit code: ${result.exitCode}`,
    "--- stdout ---",
    result.stdout || "(empty)",
    "--- stderr ---",
    result.stderr || "(empty)",
  ].join("\n");

  return wrapUntrusted(`bash:${args.argv[0]}`, truncate(body));
}
