/**
 * @repo/tools — the agent's tools and the path fence.
 *
 * V0 placeholder. The real exports arrive in V0 Slice 3:
 *   fence.ts   safeResolve — import the existing one from @repo/contracts
 *   fs.ts      list_files · read_file · write_file · edit_file
 *   shell.ts   bash
 *   search.ts  grep
 *
 * See docs/versions/V0_AGENT_LOOP.md.
 */

export const TOOLS_VERSION = "0.0.0";

/** Proves the package resolves across the workspace. Delete once fs.ts exists. */
export function hello(): { message: string } {
	return { message: "hello from @repo/tools" };
}
