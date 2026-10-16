import { startSupervisor } from "./server";

// Bundled by providers/e2b-bundle.ts and uploaded into the box — this is
// the one process the E2B provider starts there. Local mode never runs
// this file; it calls startSupervisor() directly in-process instead.
const port = Number(process.env.SUPERVISOR_PORT ?? 39911);
const sandboxRoot = process.env.SUPERVISOR_ROOT ?? "/workspace";

startSupervisor({ port, sandboxRoot }).then((instance) => {
  console.log(`supervisor listening on ${instance.baseUrl}`);
});
