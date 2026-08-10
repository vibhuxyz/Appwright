# @repo/tools

The tools the agent can call, plus the path fence that stops it escaping a workspace.

## Layout

```
src/
├── index.ts       registry: name → Tool; builds the JSON schema sent to the LLM
├── fs.ts          list_files · read_file · write_file · edit_file
├── search.ts      grep
├── shell.ts       bash  (timeout, captured stdout/stderr, exit code)
├── git.ts         worktree add/remove/diff/merge   ← V2
└── fence.ts       workspaceRoot(id) + safeResolve(id, path)
```

## Two non-negotiables

**1. The path fence.** Every filesystem tool resolves through `safeResolve()` and rejects anything
outside its workspace. Without it, `read_file("../../.env")` hands your API keys to the model.

**`@repo/contracts/src/utils/projectFiles.ts` already implements this correctly** —
`workspaceRoot(projectId)` + `safeResolve(projectId, relPath)`, per-project, path-escape guarded.
**Import it. Do not write a second one.** The API reads the file tree through it and the agent
writes through it; if two implementations disagree about what a workspace is, files land where the
UI can't see them.

**2. Truncate every result.** A 4 MB file in a tool result blows the context window on iteration
three and costs real money. Truncation happens on the way *into* message history, by default.

## Tool shape

Each tool declares its arguments as a **Zod schema**. That does double duty: it validates what the
LLM sends, and `z.toJSONSchema()` generates the schema the LLM is given. One definition, no drift.

## Reference

`ref-ai/packages/agent/src/harness/tools/` — `bash.ts` and `edit.ts` are the ones to read.
See [docs/CODE_QUALITY.md](../../../docs/CODE_QUALITY.md) §9 (validate at the boundary) and §11
(clean up in `finally`).
