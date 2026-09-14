# infrastructure/docker/orchestrator/

Empty on purpose. `apps/orchestrator` is still the `console.log("Hello via Bun!")` stub — see
[`docs/versions/V3_CLOUD_SANDBOX.md`](../../../docs/versions/V3_CLOUD_SANDBOX.md). A Dockerfile here
before the service does anything would just be dead weight to maintain. Add it in the same session
`apps/orchestrator` gets its first real `start` script.
