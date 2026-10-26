# Session 07

**Date:** 2026-10-25
**Goal of the Session:**
- Fix the environment selector, which said "Production" while the app ran on Development and showed the same values in every environment.
- Make every integration ask "Appwright test key or my own key" before showing key inputs.
- Let the agent ask multiple-choice questions mid-run, in a card that replaces the prompt box.
- Write down everything built so far in the uncommitted working tree.

## What Was Already Built (uncommitted, before this session)

The working tree held about 90 modified and 100 untracked files from earlier sessions (after commit `9b191a6 fix: auth bugs`):

- **Integration platform.** `packages/contracts/src/environment/*` and `apps/api/src/routes/integrations/`:
  - A catalog of Razorpay, Brevo email, Google OAuth and Cloudinary, with per-provider strict credential schemas.
  - `POST /v1/projects/:id/integrations/configure`, which saves, tests and records results, with two credential modes: Appwright-managed and BYOK (your own key).
  - Per-environment rows in `ProjectIntegrationEnvironment`.
  - Usage quotas with idempotency keys, an audit log, and per-project gateway access tokens.
- **Runtime gateway.** `apps/api/src/routes/integrations/runtime/`. Generated apps call Appwright, never the provider, for:
  - Brevo email
  - Razorpay order, verify and webhook (with HMAC checks)
  - Cloudinary upload
- **Environment and secrets registry.**
  - `ProjectEnvironmentVariable` plus encrypted `Secret` rows.
  - Manifest generation (`packages/planner/src/manifest`) that seeds the integrations and env vars an app needs.
  - Deployment preflight checks and a safe `.env.example` generator.
- **Email providers.** `packages/db/src/email/`: Brevo, Nodemailer (SMTP) and Resend, selectable per environment.
- **Vercel env sync.** `apps/api/src/routes/vercel-sync.ts` pushes resolved variables and gateway tokens to Vercel.
- **Attachments and multimodal prompts.**
  - Upload and parse images and PDFs (`apps/api/src/attachments`, `packages/media/src/attachment`).
  - Analyze them into a project specification (`packages/agent-core/src/multimodal`, `packages/contracts/src/specification`, `packages/blueprint/src/spec-to-content.ts`).
- **Project create and delete.**
  - Starter templates with previews and optional connectors (`apps/web/src/features/dashboard/components/project-create/`).
  - A delete modal with toasts (`shared/components/toast`).
- **Download code.** A zip of the workspace (`apps/api/src/workspace/zip-project.ts`) behind a subscription paywall (`DownloadCodeButton`, `CodeSubscriptionPaywall`).
- **A step-by-step credential card** (`AgentQuestionCard` and friends). It asked for keys straight away and stayed above the prompt box. Replaced this session.
- **Four migrations:** `add_project_integrations_and_environment_variables`, `add_project_attachments_and_specification`, `add_integration_platform_foundation`, `add_project_starter_id`.

## What We Built This Session

- **Phase A — environment truth (D74):**
  - **Header badge.** It now shows the real environment. The new `apps/web/src/features/projects/runtime-environment/` shows "Development" until `vercelProjectId` exists (exposed as `hasProductionDeployment`). Used in the console header and the dashboard card.
  - **Per-environment overview.** `GET /v1/projects/:id/environment?environment=` and `getEnvironmentOverview({ projectId, environment })` load only that environment plus `all`. They are built from the pure functions in `packages/db/src/environment-view/`. Empty credential placeholder rows are dropped, so tabs no longer list the same "Missing value" keys.
  - **Database source per environment.** "Appwright database (name)", "Your MongoDB URI", or "Not provisioned — created on first deploy".
  - **Status per environment.**
    - `runIntegrationTest` (`packages/db/src/integration-status/`) records only the tested environment, then summarizes.
    - `testIntegration` no longer writes anything.
    - The pure status rules live in `packages/contracts/src/integration-policy/`.
  - **No more defaults to "all" or "production".** Variable and email-provider writes now require an environment; the API no longer defaults them to `all`, or to `production` for preflight and sync.
  - **Setup dialog.** It no longer switches silently to development.
  - **One credential key list.** Derived from the catalog, it replaces four hand-written copies.
- **Phase B — "Appwright test key" vs "my own key":**
  - **Managed credentials in one place.** `packages/db/src/integration-runtime/` holds them for email, Razorpay (`rzp_test_` only), Cloudinary (reusing the platform `CLOUDINARY_*` account) and MongoDB (the platform cluster).
  - **Managed Cloudinary.** Uploads go to `appwright-apps/{project}/{environment}` with a 10-upload quota. All managed limits now live in `MANAGED_USAGE_LIMITS`.
  - **Your own MongoDB URI.** Added to the catalog and credential schemas. Choosing the Appwright database provisions it. Deploy keeps your own production URI, and the production preflight passes with "created on first deploy".
  - **Gateway token in development.** `resolveSandboxRuntimeEnv` adds it to the dev server and `.env.local`, so test keys work while building. The dev server now gets a short env allowlist instead of every API secret.
  - **Web pieces.** `apps/web/src/features/environment/credential-setup/`:
    - Mode options, then one field at a time.
    - An optional separate production key.
    - A Razorpay test key is never sent to production.
- **Phase C — the agent asks and waits (D75):**
  - **New tables** `agent_questions` and `integration_requests` (uuid v7 ids, status CHECK constraints), with repositories and the shared `pollUntil`.
  - **Per-job agent tools.** `ask_user` and `request_integration` (`apps/agent/src/worker/interactive-tools/`):
    - They validate their arguments and refuse questions that ask for secrets.
    - Waits are capped by the run deadline.
    - Free-text answers are fenced as user data.
    - On a dismiss or timeout the agent carries on with defaults.
  - **SSE and routes.** A new `agent_question` frame. Session-scoped routes to list, answer and dismiss, each with an ownership check.
  - **System prompt.** A new "Asking the user" section.
- **Phase D — builds wait for key choices (D77).** `prepareBuildEnvironment` (agent) and `awaitRequiredIntegrations` (API Plan tab):
  1. Open requests for required integrations that aren't connected.
  2. Wait up to 10 minutes.
  3. Provision the development database unless you chose your own.
  4. Re-inject the env.
- **Phase E — the question dock.** `apps/web/src/features/agent/questions/`:
  - Replaces the composer when anything is pending.
  - Shows agent questions first, then integration choices.
  - "Topic — question", checkbox or radio options, "Something else", "‹ Question i of N ›", Auto-answer, Next/Submit, and X to dismiss.
  - Chat rows for `ask_user` and `request_integration`.
  - The old card files are deleted.
- **Tests.**
  - New: `packages/contracts/test/integration-policy.test.ts`, `agent-question.test.ts`; `packages/db/test/environment-view.test.ts`, `integration-runtime.test.ts`, `poll-until.test.ts`, `agent-question.test.ts`, `integration-request.test.ts`; `apps/api/test/interaction-routes.test.ts`; `apps/agent/test/interactive-tools.test.ts`, `await-integration-requests.test.ts`; `apps/web/test/derive-runtime-environment.test.ts`, `build-configure-requests.test.ts`, `question-dock-steps.test.ts`.
  - Updated: environment routes, the email provider test, Cloudinary upload, and the email routes test.

## What I Implemented Myself

- The user reported the bugs from the running app and shared Replit-style reference screenshots. They chose four directions:
  - Pause and wait for answers.
  - Builds wait for key choices.
  - Reuse the existing Cloudinary account.
  - Allow your own MongoDB URI.
- They approved the plan. That approval covered the two migrations, the managed quotas, managed MongoDB in production, and the dev-server env allowlist.
- **The tool (Claude Code) wrote all of the code and tests in this session.** The user wrote none of it.
- **Verification:**
  - `check-types` passes in web, api, agent-worker, cache, agent-core, blueprint, assets and planner; `tsc --noEmit` passes in contracts and db.
  - `bun test` passes: contracts 53, db 74, web 30, api 145, agent 42.
  - Browser check against the user's running dev stack. Questions and an integration request were inserted directly into the local database rather than produced by the model:
    - The badge shows Development.
    - The Development and Production tabs show different database sources and connector statuses.
    - The dock replaces the prompt box.
    - Validation, Auto-answer, "Something else", the own-key steps and the live-key guard all work.
    - X marks rows `DISMISSED`; Submit marks them `ANSWERED` with the selected indexes.
- **Not run:** a live agent run where the model itself calls `ask_user`. It would spend credits and write code into the user's project.

## New Concepts Learned

1. **A pending question is a database row, not process state.** The agent writes a row, publishes an SSE frame, and polls until the row resolves. A browser reload, a dock remount, or an API restart loses nothing. The same pattern already existed for section images (`AssetRequest`).
2. **The "current environment" is derived, not stored.** The workspace always runs Development. "Production" only becomes true once a deployment exists. Showing `READY` as "Production" was a label pretending to be a fact.

## Engineering Decisions Made

- **D74:** environment data is per environment, end to end.
- **D75:** agent questions and integration requests are DB-backed waits inside the run.
- **D76:** the Appwright-managed MongoDB is allowed in production; other test keys stay dev and preview only.
- **D77:** builds wait for integration choices before writing code.

## Mistakes I Made

- **Stale Prisma client.** After applying the two migrations, the generated Prisma client was out of date and the new repositories failed to typecheck until `prisma generate` ran again.
- **Missed callers of the removed pending endpoint.** Replacing `GET /environment/pending-requirements` broke two existing tests: the `ProjectResponse` fixture, after adding `hasProductionDeployment`, and the Google OAuth email-routes test, which still called the endpoint. Both were caught by the full suites, not by targeted runs.
- **Unrelated drift in a migration.** The first generated `add_agent_questions` migration included an unrelated column change, because `schema.prisma` didn't match an earlier migration. I regenerated it after aligning the schema with the database, so the migration has one purpose.
- **Duplicate dev servers.** During browser testing I started duplicate API and agent processes before noticing the user's own dev stack was already running in watch mode. I stopped the duplicates.

## Homework Before Next Session

- To offer Razorpay and Brevo test keys, set `APPWRITE_MANAGED_RAZORPAY_KEY_ID` (`rzp_test_…`), `APPWRITE_MANAGED_RAZORPAY_KEY_SECRET`, `APPWRITE_MANAGED_BREVO_API_KEY` and `APPWRITE_MANAGED_EMAIL_FROM` in `.env`. They are empty today, so only Cloudinary and the database offer a test key.
- Run one real prompt ("Add the Razorpay integration to my app") to see the model choose to call `ask_user`, and judge the questions it writes.
- Decide whether to commit this as several commits: environment fix, test keys, agent questions, dock.

## Next Session Plan

- Live-run review of `ask_user` question quality.
- Split `ChatPane.tsx` (162 lines) and `job-worker.ts` (392 lines) under their limits.
- Consider pausing the loop deadline while the agent waits.
