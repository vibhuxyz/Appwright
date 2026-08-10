# devian_tools

The tools the agent can call, plus the path fence that stops it escaping a workspace.

## Layout

```
src/devian_tools/
├── registry.py        name → Tool lookup; builds the JSON schema sent to the LLM
├── fs.py              list_files, read_file, write_file, edit_file
├── search.py          grep
├── shell.py           bash  (timeout, captured stdout/stderr, exit code)
├── git.py             worktree add/remove/diff/merge   ← V2
├── fence.py           workspace_root(id) + safe_resolve(id, path)
└── export_schema.py   dumps Pydantic JSON Schema for the TS side (make contracts, D10)
```

## Two non-negotiables

**1. The path fence.** Every filesystem tool resolves through `safe_resolve()` and rejects
anything outside its workspace. Without it, `read_file("../../.env")` hands your API keys to the
model.

The TypeScript version already exists and is correct —
`libs/ts/contracts/src/utils/projectFiles.ts` (`workspaceRoot(projectId)` +
`safeResolve(projectId, relPath)`). **Port its logic, keep the same semantics.** The API reads
the file tree through the TS one; the agent writes through this one. They must agree on what a
workspace is.

**2. Truncate every result.** A 4 MB file in a tool result blows the context window on iteration
three and costs real money. Truncation happens on the way *into* message history, by default,
not as an afterthought.

## Schema generation

Each tool declares its arguments as a Pydantic model. That model does double duty: it validates
what the LLM sends, and it generates the JSON Schema the LLM is given. One definition, no drift.
