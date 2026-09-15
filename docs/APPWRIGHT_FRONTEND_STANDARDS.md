# Appwright Frontend — Code Organization, Patterns & Optimization Standard

Scope: the Appwright frontend codebase only.

This answers two questions for every piece of code:

1. **Where does this code go?**
2. **Which tool / hook do I use here?**

Core principle:

```
feature ownership
+ explicit state ownership
+ thin UI components
+ dedicated realtime layer
```

Last rule first, because it overrides the rest: **don't optimize by habit.** Keep ownership clean → profile → then add `memo`, `useMemo`, `useCallback`, virtualization, rAF, workers.

---

# Part 1 — Stack & Ownership

## 1. Stack

```
React
TypeScript
Vite
TanStack Router
TanStack Query
TanStack Virtual
Zustand
Tailwind CSS
shadcn/ui + Base UI
Lucide
React Hook Form
Zod
Monaco
xterm.js
Native WebSocket
Vitest
React Testing Library
Playwright
```

## 2. One tool, one responsibility

```
Routing          → TanStack Router
Server data      → TanStack Query
Global UI state  → Zustand
Local UI state   → useState
Complex local    → useReducer
Forms            → React Hook Form
Validation       → Zod
Realtime         → dedicated WebSocket layer
Editor           → Monaco
Terminal         → xterm.js
Styling          → Tailwind + tokens
Components       → shadcn / Base UI
Imperative objs  → useRef
```

## 3. Ownership diagram

```
                    DATA / STATE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Backend data      Client state      Local state
        │                │                │
  TanStack Query      Zustand          useState
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                     React UI
```

---

# Part 2 — Folder Structure

## 4. Top level

```
src/
│
├── app/
│   ├── router/
│   ├── layouts/
│   ├── providers/
│   └── config/
│
├── routes/
│   ├── auth/
│   ├── dashboard/
│   └── project/
│
├── features/
│   ├── dashboard/
│   ├── projects/
│   ├── workspace/
│   ├── agent/
│   ├── preview/
│   ├── deployments/
│   ├── health/
│   ├── templates/
│   ├── billing/
│   └── settings/
│
├── realtime/
│   ├── connectionManager.ts
│   ├── subscriptionManager.ts
│   ├── eventRouter.ts
│   ├── eventValidator.ts
│   └── types.ts
│
├── stores/
│   ├── uiStore.ts
│   ├── authStore.ts
│   ├── connectionStore.ts
│   └── commandStore.ts
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── schemas/
│   ├── types/
│   └── utils/
│
└── workers/
```

## 5. Feature structure

Every large feature follows the same shape:

```
features/agent/
├── components/
├── hooks/
├── api/
├── store/
├── schemas/
└── types.ts
```

Concrete example:

```
features/deployments/

components/
├── DeployButton.tsx
├── DeploymentCard.tsx
├── DeploymentList.tsx
├── DeploymentLogs.tsx
└── DeploymentStatus.tsx

hooks/
├── useDeploy.ts
└── useDeployment.ts

api/
└── deploymentApi.ts

store/
└── deploymentStore.ts

schemas/
└── deploymentSchemas.ts

types.ts
```

**Rule:** a feature owns its UI, API, hooks, local state, schemas and types.

Do **not** create giant global folders (`components/`, `services/`, `hooks/`, `utils/`) and dump every feature inside them.

## 6. Import rules & dependency direction

```
app
 ↓
routes
 ↓
features
 ↓
shared
```

```
realtime
 ↓
stores
 ↓
features
```

A feature can import `shared`. **`shared` must never import a feature.**

Bad:

```
shared/components/Button
    ↓
features/agent
```

No reverse dependency, ever.

## 7. Naming

```
ProjectCard.tsx
ProjectList.tsx
ProjectHeader.tsx

useProjects.ts
useProject.ts

projectApi.ts
projectSchemas.ts
projectStore.ts
```

Avoid: `ProjectStuff.tsx`, `helpers2.ts`, `common.ts`, `misc.ts`, `utilsFinal.ts`.

## 8. Types

```
shared/types/            → domain types used across features
features/<feature>/types.ts → feature-only types
```

If a type is only used by Agent, it lives in `features/agent/types.ts`. Don't dump everything into `types/index.ts`.

## 9. Schemas

Schemas live with their feature:

```
features/deployments/schemas/
features/agent/schemas/
features/projects/schemas/
```

`shared/schemas/` only when genuinely shared.

## 10. Don't duplicate backend types by hand

Prefer:

```
backend schema → OpenAPI / contract → generated client + types
```

or:

```
shared Zod schema → TypeScript inference
```

One source of truth.

---

# Part 3 — Routes & Components

## 11. Routes stay thin

Bad:

```tsx
function ProjectPage() {
  // API
  // websocket
  // state
  // business logic
  // 900 lines JSX
}
```

Good:

```tsx
export function ProjectPage() {
  return <ProjectOverview />;
}
```

A route is responsible for: URL, params, route loader, authorization, prefetch, layout, page component.

Business logic belongs in `features/`.

## 12. Components stay small and composable

Prefer:

```
ProjectOverview
 ├── ProjectHeader
 ├── ProjectStatus
 ├── PreviewCard
 ├── HealthCard
 └── ActivityFeed
```

instead of `ProjectPage.tsx → 1200 lines`.

A component should mostly: read state → call a hook → render UI.

Not: API requests, data normalization, WebSocket management, business calculations, DOM management.

---

# Part 4 — Hooks & State

## 13. useState

For small local UI state.

```tsx
const [isOpen, setIsOpen] = useState(false);
const [activeTab, setActiveTab] = useState("logs");
const [search, setSearch] = useState("");
```

Good: modal open, dropdown, temporary input, active tab, hover, local toggle.

Not for: projects, deployments, agent runs, global workspace state.

## 14. useReducer

Use when local state becomes a multi-step state machine:

```
idle → creating → success
idle → error
```

Use when several state variables must change together. Don't use it just because you can.

## 15. useRef

For imperative / non-render values.

```
Monaco instance
xterm instance
WebSocket
iframe
ResizeObserver
AbortController
timeout ID
requestAnimationFrame ID
DOM nodes
```

```tsx
const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const rafRef = useRef<number | null>(null);
```

Use `useRef` instead of `useState` when changing the value must **not** cause a render.

## 16. useEffect

Only for external side effects.

Good: WebSocket connect/disconnect, Monaco init, iframe messaging, window events, keyboard events, ResizeObserver, document title.

Bad:

```tsx
useEffect(() => {
  setFilteredProjects(...)
}, [projects, search]);
```

Calculate during render instead:

```tsx
const filteredProjects = useMemo(
  () => filterProjects(projects, search),
  [projects, search]
);
```

Never use `useEffect` as your general business-logic engine.

### Dependency discipline

Bad:

```tsx
useEffect(() => {
  loadProject();
}, []);
```

when `projectId` is dynamic.

Good:

```tsx
useEffect(() => {
  loadProject(projectId);
}, [projectId]);
```

Better: if it's server data, use TanStack Query instead of loading it in an effect.

## 17. useMemo

Use when the calculation is expensive, **or** the value is passed to a memoized child.

```tsx
const filteredProjects = useMemo(
  () => filterProjects(projects, search),
  [projects, search]
);
```

Good cases: large file tree filtering, large log filtering, sorting, grouping, diff preparation, health aggregation, deployment summaries.

Useless:

```tsx
const title = useMemo(() => project.name, [project.name]);
```

## 18. useCallback

Use when function identity matters:

- passed to a memoized child
- used as an effect dependency
- subscription handlers
- handlers passed deep into a tree

```tsx
const handleFileSelect = useCallback(
  (path: string) => selectFile(path),
  [selectFile]
);

<FileTree onSelect={handleFileSelect} />
```

Don't wrap every function.

## 19. React.memo

Use for components that render frequently, receive stable props, are expensive, or appear many times in a list.

```tsx
export const FileTreeRow = memo(FileTreeRowComponent);
export const AgentMessage = memo(AgentMessageComponent);
export const DeploymentLogRow = memo(DeploymentLogRowComponent);
export const ProjectCard = memo(ProjectCardComponent);
```

Don't:

```tsx
export default memo(App);
export default memo(Header);
export default memo(Button);
```

`memo` is only useful when it prevents meaningful repeated work.

## 20. memo + useMemo + useCallback together

Use as a set, selectively:

```tsx
const FileRow = memo(FileRowComponent);
const visibleFiles = useMemo(...);
const handleSelect = useCallback(...);
```

Good for: file tree, large logs, deployment events, activity feed, large project lists.

Not for ordinary static cards.

## 21. useTransition

For non-urgent UI updates.

```tsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setSearch(value);
});
```

Use for: searching large deployment history, filtering large activity feeds, filtering large project lists.

Don't use it to hide genuinely slow API calls.

## 22. useDeferredValue

When a value changes fast but the expensive UI can lag slightly.

```tsx
const deferredSearch = useDeferredValue(search);
```

Use for: search → large file tree, search → large logs.

## 23. useOptimistic

For interactions that can safely show a temporary state.

Good: rename project, toggle favorite, reorder tabs, send agent message.

Don't use it for deployment / build / database status. For those, **server response = truth**.

## 24. Custom hooks

Don't put application logic directly into giant components.

```
useProjects()
useProject()
useProjectHealth()
useDeployment()
useAgent()
useAgentStream()
useWorkspace()
useFileTree()
usePreview()
useKeyboardShortcut()
useResizablePanel()
useMediaQuery()
useDebounce()
```

```tsx
function ProjectOverview() {
  const { data, isPending, error } = useProject(projectId);

  if (isPending) return <ProjectSkeleton />;
  if (error) return <ProjectError />;

  return <ProjectContent project={data} />;
}
```

The hook owns data fetching. The component owns presentation.

## 25. One hook = one responsibility

Avoid `useProjectEverything()` containing API + WebSocket + agent + preview + deployment + health + editor + billing.

Split it:

```
useProject()
useProjectHealth()
useDeployment()
useAgent()
usePreview()
```

## 26. Hook organization

```
shared/hooks/     → truly reusable only
  useDebounce
  useMediaQuery
  useClipboard
  useKeyboardShortcut
  useMounted
  useResizeObserver

features/<feature>/hooks/  → business-specific
  features/agent/hooks/useAgentRun
  features/projects/hooks/useProjects
  features/workspace/hooks/useFileTree
  features/deployments/hooks/useDeployment
```

Never create `shared/hooks/useEverything.ts`.

---

# Part 5 — Server State, Client State, Forms

## 27. TanStack Query — server state

```
GET projects
GET project
GET deployments
GET templates
GET health
GET billing
GET settings
GET agent history
```

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["project", projectId],
  queryFn: () => projectApi.get(projectId),
});
```

```tsx
useMutation({
  mutationFn: projectApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  },
});
```

Server data belongs in the server-state layer, not in a second global-state copy.

## 28. Mutation rule

```
mutation → server success → invalidate relevant query → UI updates
```

Don't manually maintain five copies of the same server data.

## 29. Zustand — client-owned state only

```
uiStore
├── sidebarOpen
├── activePanel
├── theme
└── commandPalette

workspaceStore
├── activeFile
├── openTabs
├── splitLayout
└── activeTerminal

agentStore
├── activeRun
├── streamingMessage
├── toolCall
└── status

connectionStore
├── status
├── latency
└── lastEvent
```

Don't use Zustand as a replacement for TanStack Query.

## 30. Zustand selector rule

Prefer:

```tsx
const activeFile = useWorkspaceStore(state => state.activeFile);
```

instead of:

```tsx
const workspace = useWorkspaceStore();
```

The narrow selector subscribes to only what the component needs. This matters most in workspace / realtime UI.

## 31. Keep heavy state out of Context

Avoid:

```tsx
<AppContext.Provider value={{
  projects, agent, deployments, workspace, health, settings
}}>
```

Every update risks broad rerendering.

```
Context        → theme / auth / infrequently changing dependencies
Zustand        → interactive global state
TanStack Query → server state
```

## 32. Derived data should be derived

Don't store `projects`, `filteredProjects`, `sortedProjects`, `projectCount` separately.

Store the source (`projects`) and derive the rest with `useMemo`. This prevents state-sync bugs.

## 33. React Hook Form

Use for: create project, project settings, environment settings, invite members, billing, integrations, structured agent prompts.

```
useForm + zodResolver + Zod schema
```

Don't build complicated forms out of 10 separate `useState`s.

Flow:

```
Input → RHF → Zod → Mutation → Query invalidation
```

## 34. Zod — validate all external data

```
API response
WebSocket payload
form input
URL parameters
environment / configuration
```

```
server → JSON → Zod → typed object → application
```

Never blindly trust:

```ts
const data = await response.json();
```

---

# Part 6 — Realtime

## 35. All WebSocket logic lives in `src/realtime/`

Not inside React components.

```
WebSocket
    ↓
ConnectionManager
    ↓
SubscriptionManager
    ↓
EventValidator
    ↓
EventRouter
    ↓
stores / query invalidation
    ↓
React
```

Transport feeds a state layer. It does not drive components directly.

## 36. Event handling

Never:

```ts
ws.onmessage = e => {
  setState(JSON.parse(e.data));
};
```

Do:

```
raw event → parse → validate → identify → route → update the right state
```

```ts
switch (event.type) {
  case "agent.message":
    agentStore.getState().addMessage(event);
    break;

  case "deployment.status":
    deploymentStore.getState().update(event);
    break;

  case "file.changed":
    workspaceStore.getState().applyFileChange(event);
    break;
}
```

## 37. Different events route differently

```
agent.message      → agentStore
file.changed       → workspaceStore
deployment.status  → invalidate deployment query + UI status
health.changed     → invalidate health query
activity.created   → invalidate activity query
```

Realtime is the notification/transport layer. It is not automatically the source of truth.

## 38. Realtime rendering optimization

Agent output can produce hundreds of events. Don't re-render the page for a single token, log line, build tick or file event.

```
event → small store update → small selector → specific component
```

```tsx
const deploymentStatus = useDeploymentStore(state => state.status);
```

---

# Part 7 — Domain Layers

## 39. Workspace state

```
Zustand         → selected file, open tabs, panel dimensions, active panel, editor settings
Query / backend → file contents, file metadata, git status, project filesystem
Monaco ref      → editor instance, models, editor commands
```

```
Backend → Workspace Query → Workspace Store → Monaco
```

## 40. Agent state

```
Agent API + WebSocket
     ↓
agentStore
     ↓
AgentPanel
```

Store: run status, current step, messages, tool execution, file changes, errors.

Don't put the complete immutable project filesystem inside the agent store.

## 41. File changes from the agent

```
Agent event → workspace store → editor model update
```

After the operation completes:

```
GET authoritative file → server truth
```

This stops the editor from becoming a fake source of truth.

## 42. Preview

```
iframe + postMessage + WebSocket/API status
```

```tsx
const iframeRef = useRef<HTMLIFrameElement>(null);
```

Never put a DOM object into Zustand.

## 43. Monaco

Keep Monaco isolated in:

```
features/workspace/components/CodeEditor.tsx
features/workspace/hooks/useEditor.ts
```

`useEditor` owns: create editor, load model, switch model, save, dispose, keyboard shortcuts, format, search.

The rest of Appwright shouldn't know Monaco APIs.

## 44. Terminal

```
TerminalPanel → useTerminal() → xterm.js → WebSocket → Sandbox PTY
```

Don't let random components write to the terminal connection.

---

# Part 8 — API Layer

## 45. Per-feature API modules

```
features/projects/api/projectApi.ts
features/agent/api/agentApi.ts
features/deployments/api/deploymentApi.ts
```

Shared HTTP client:

```
shared/lib/api.ts
```

Flow:

```
Component → Hook → Feature API → Shared HTTP client → Backend
```

Not `Component → fetch()` everywhere.

## 46. The shared client

```ts
api.get()
api.post()
api.put()
api.delete()
```

Centralizes: base URL, credentials, headers, error parsing, timeouts, request IDs, authentication.

## 47. Abort requests

```ts
const controller = new AbortController();

fetch(url, { signal: controller.signal });

return () => controller.abort();
```

Useful for: search, preview requests, file loading, AI requests, rapid navigation.

Don't let obsolete requests overwrite newer state.

## 48. Don't waterfall independent requests

Bad:

```
getProject() → getDeployments() → getHealth() → getActivity()
```

Prefer parallel:

```
getProject()
getDeployments()    ↓ parallel
getHealth()
getActivity()
```

## 49. Prefetch predictable data

```
hover Project → prefetch project data
open project  → prefetch deployments → prefetch health
```

Don't prefetch the entire application.

---

# Part 9 — Loading, Empty, Error

## 50. Every async feature has four states

```
loading / success / empty / error
```

```
ProjectList
├── ProjectListSkeleton
├── ProjectGrid
├── EmptyProjects
└── ProjectError
```

Avoid `if (loading) return <Spinner />;` scattered everywhere with unrelated UI.

## 51. Skeleton vs spinner vs progress

```
Skeleton    → content has a known shape
Spinner     → short button/action operation
Progress    → long-running operation
Empty state → no data
Error state → request failed
```

```
Deploy button     → spinner
Deployment page   → skeleton
Deployment build  → progress
No deployments    → empty state
Deployment failed → error state
```

## 52. Skeleton only the loading part

Bad — whole screen:

```
████████████████████
████████████████████
████████████████████
```

Better:

```
Project page
 ├── Header   → real
 ├── Status   → skeleton
 ├── Preview  → skeleton
 ├── Activity → skeleton
 └── Sidebar  → real
```

Build primitives and compose:

```
Skeleton
SkeletonText
SkeletonAvatar
SkeletonCard
SkeletonTable

<ProjectCardSkeleton />
```

## 53. Error boundaries

```
App
 └── Route
      └── Feature
           └── Component
```

A broken deployment panel must not destroy the whole workspace.

---

# Part 10 — Performance

## 54. Lazy loading

Route level:

```tsx
const WorkspacePage = lazy(() => import("@/routes/project/$projectId/workspace"));
const DeploymentsPage = lazy(() => import("@/routes/project/$projectId/deployments"));
```

```tsx
<Suspense fallback={<PageSkeleton />}>
  <WorkspacePage />
</Suspense>
```

Heavy components / libraries:

```tsx
const CodeEditor = lazy(() => import("./CodeEditor"));
const TraceViewer = lazy(() => import("./TraceViewer"));
const TerminalPanel = lazy(() => import("./TerminalPanel"));
```

Good candidates: Monaco, xterm, trace viewer, large charts, diff viewer, heavy settings sections, workspace-only components.

Keep eager: AppShell, Header, Sidebar, basic UI, authentication, small buttons, icons, tiny reusable components.

## 55. Preloading

When navigation is highly predictable:

```tsx
onMouseEnter={() => {
  void import("@/routes/project/$projectId/workspace");
}}
```

Useful for: sidebar navigation, project workspace, deployment page, settings.

## 56. Virtualization

Use `@tanstack/react-virtual` for: large logs, large file trees, large activity feeds, large deployment logs, large search results.

Don't virtualize 20 project cards, 10 settings rows, or small menus.

## 57. Stable list keys

Never:

```tsx
items.map((item, index) => <Row key={index} />)
```

for reorderable/dynamic data.

Use:

```tsx
items.map(item => <Row key={item.id} />)
```

Critical for: file tree, agent messages, deployment logs, tabs, projects, activity.

## 58. Debounce search

```tsx
const debouncedSearch = useDebounce(search, 250);
```

Use for: project search, file search, deployment search, activity filtering, API-backed search.

Don't debounce every UI input.

## 59. Throttle expensive UI updates

For rapid events — agent token stream, terminal output, resize, scroll, preview events — use throttling or `requestAnimationFrame`.

```ts
requestAnimationFrame(() => {
  updateUI();
});
```

Throttle **rendering**, not the underlying data, when the data must stay complete.

## 60. Resize handling

Don't add `window.addEventListener("resize", ...)` in 15 components.

Create `useResizeObserver()` and use it where container size actually matters.

## 61. Inline object recreation

Only where prop identity matters, e.g. a heavily memoized component.

Bad:

```tsx
<Editor options={{ minimap: { enabled: false } }} />
```

Better:

```tsx
const editorOptions = useMemo(() => ({ minimap: { enabled: false } }), []);

<Editor options={editorOptions} />
```

Don't obsess about this everywhere.

## 62. Event handlers

Static/simple components: `onClick={handleClick}` is fine.

High-frequency / large lists: memoized child + `useCallback` + stable props.

## 63. Don't render hidden heavy components

Bad:

```tsx
<>
  <Workspace />
  {!open && <div />}
</>
```

For genuinely heavy features:

```tsx
{activePanel === "workspace" && <Workspace />}
```

or lazy-load the feature. But don't constantly mount/unmount where preserving state matters.

## 64. Animation

Don't animate high-frequency UI: agent tokens, terminal lines, logs, rapid file-tree updates, preview status ticks.

Use animation for: modal, drawer, toast, panel open/close, page transition, small state transitions.

## 65. CSS before JavaScript

Prefer CSS for hover, focus, transition, opacity, transform, color transition, simple skeleton animation.

Instead of:

```tsx
const [hovered, setHovered] = useState(false);
```

when CSS can do it.

## 66. Web Workers

Don't create workers by default. Only after profiling proves main-thread work is expensive.

Possible uses: large diff calculation, large file parsing, syntax-heavy analysis, large search/index operations.

## 67. Memoization rule

Don't blindly use `memo()`, `useMemo()`, `useCallback()`.

Use them for: large component trees, frequent updates, expensive calculations, large lists, high-frequency realtime UI.

**Profile first.**

---

# Part 11 — Assets, Links, Styling

## 68. Images in Vite

Import static assets:

```tsx
import logo from "@/assets/logo.svg";

<img src={logo} alt="Appwright" />
```

Don't hardcode:

```tsx
<img src="/src/assets/logo.svg" />
```

For files that must keep an exact URL:

```
public/
├── favicon.svg
├── robots.txt
└── static/
```

```tsx
<img src="/favicon.svg" alt="" />
```

## 69. Image attributes

Normal image:

```tsx
<img
  src={heroImage}
  alt="Appwright workspace"
  width={1200}
  height={700}
  loading="lazy"
  decoding="async"
/>
```

Above-the-fold / logo / LCP image:

```tsx
<img
  src={logo}
  alt="Appwright"
  width={120}
  height={32}
  loading="eager"
  decoding="async"
/>
```

Never lazy-load the main LCP image.

## 70. Never leave dimensions implicit

Bad:

```tsx
<img src={image} alt="" />
```

Better:

```tsx
<img src={image} width={320} height={180} alt="Project preview" />
```

Reserves layout space and prevents layout shift.

## 71. Responsive images

```tsx
<img
  src={image}
  srcSet={`${small} 480w, ${medium} 800w, ${large} 1200w`}
  sizes="(max-width: 768px) 100vw, 1200px"
  alt="..."
  loading="lazy"
  decoding="async"
/>
```

## 72. Links vs actions

External:

```tsx
<a href="https://docs.appwright.com" target="_blank" rel="noopener noreferrer">
  Documentation
</a>
```

Internal:

```tsx
<Link to="/projects">Projects</Link>
```

Don't do:

```tsx
<button onClick={() => window.location.href = "/projects"}>Projects</button>
```

Don't do:

```tsx
<a onClick={handleDeploy}>Deploy</a>
```

Do:

```tsx
<Button onClick={handleDeploy}>Deploy</Button>
```

**Anchor/Link = navigation. Button = action.** This matters for accessibility and keyboard behavior.

## 73. Styling

Use Tailwind + design tokens + shadcn components.

Don't scatter `style={{ color: "#..." }}`.

Semantic tokens (defined in `apps/web/src/index.css`, `@theme`):

```
background        #0F1113   page
background-deep   #080809   modal backdrop, preview letterbox
surface           #1C1D1F   every panel/card
surface-2         #232425   inputs, rows, elevated cards
surface-3         #2A2B2D   hover / selected
border            #303234   card borders
border-soft       #252729   internal dividers
foreground        #F5F5F5   titles
foreground-sec.   #B0B1B2   descriptions
muted             #77797C   helper, inactive
lime              #E3FC18   THE product action — send, create, continue, active
pink / pink-light #F80058 / #F43ABC   money only: deploy, upgrade, promotions
blue / blue-bright informational accents, never a CTA
success warning danger
```

Colour language: lime = do the thing, pink = pay for the thing. Target roughly
60-70% background, 20-25% surface, 5-10% typography, 1-3% lime, <2% pink. One
lime element per pane — a lime border or a lime heading is a bug, not emphasis.

## 74. UI primitives

```
shared/components/ui/
  Button, Input, Dialog, Popover, Dropdown, Tooltip,
  Tabs, Command, Sheet, Sidebar, Badge, Skeleton
```

Product-specific components are built in features:

```
shared/ui/Button → features/deployments/DeployButton
```

---

# Part 12 — Storage, Auth, Testing

## 75. Browser storage

Use local persistence only for non-sensitive UI preferences.

```
Good: theme, sidebar width, open tabs, editor preferences
Bad:  JWT, API keys, DB credentials, production secrets
```

Auth tokens in browser storage are a temporary shape only. Production auth moves to **HttpOnly + Secure + SameSite cookies**.

## 76. Testing

**Unit (Vitest):** formatters, validators, reducers, pure business calculations, event parsing, utilities.

**Component (React Testing Library):** AgentPanel, ProjectCard, DeploymentStatus, forms, dialogs.

**E2E (Playwright):** login → create project → send prompt → agent modifies app → preview appears → deploy → deployment succeeds.

Playwright comes at the final production-quality rung, not before the core architecture works.

---

# Part 13 — Clean Code & Engineering Practice

## 77. TypeScript strictness

`tsconfig` must have `strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`.

Banned:

```ts
const data: any = await res.json();
const project = maybeProject!;        // non-null assertion
const x = value as Project;           // blind cast
// @ts-ignore
```

Use instead:

```ts
const json: unknown = await res.json();
const project = projectSchema.parse(json);   // unknown → Zod → typed
```

If you truly must suppress, use `@ts-expect-error` with a one-line reason. It fails the build once the error is gone, so it can't rot.

## 78. Model state as unions, not loose booleans

Bad:

```ts
interface DeployState {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  data?: Deployment;
}
```

This allows impossible combinations (`isLoading && isError`).

Good:

```ts
type DeployState =
  | { status: "idle" }
  | { status: "running"; startedAt: number }
  | { status: "success"; deployment: Deployment }
  | { status: "failed"; error: DeployError };
```

Now `switch (state.status)` is exhaustive and TypeScript catches missing cases.

## 79. Naming conventions

```
Components        PascalCase        DeploymentCard
Hooks             useX              useDeployment
Booleans          is / has / can    isOpen, hasUnsavedChanges, canDeploy
Event handlers    handleX           handleFileSelect
Handler props     onX               onSelect, onDeploy
Async functions   verb first        fetchProject, createDeployment
Constants         UPPER_SNAKE       MAX_LOG_LINES
Types             PascalCase noun   Deployment, DeployError
Zod schemas       xSchema           deploymentSchema
```

Name by intent, not by type: `activeFile`, not `fileString`.

## 80. Small functions, guard clauses, shallow nesting

Bad:

```tsx
function DeployButton({ project }: Props) {
  if (project) {
    if (project.canDeploy) {
      if (!project.isDeploying) {
        return <Button onClick={deploy}>Deploy</Button>;
      } else {
        return <Button disabled>Deploying…</Button>;
      }
    }
  }
  return null;
}
```

Good — return early, keep one level of nesting:

```tsx
function DeployButton({ project }: Props) {
  if (!project?.canDeploy) return null;
  if (project.isDeploying) return <Button disabled>Deploying…</Button>;

  return <Button onClick={deploy}>Deploy</Button>;
}
```

Practical limits: a function does one job; more than ~3 arguments becomes an options object; more than 3 levels of nesting means extract a function.

## 81. No magic numbers or strings

Bad:

```ts
if (logs.length > 5000) trim();
setTimeout(reconnect, 3000);
queryKey: ["project", id]
```

Good:

```ts
// features/workspace/constants.ts
export const MAX_LOG_LINES = 5_000;
export const RECONNECT_DELAY_MS = 3_000;

// features/projects/queryKeys.ts
export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
  deployments: (id: string) => ["projects", id, "deployments"] as const,
};
```

Centralized query keys also stop invalidation bugs caused by typos.

## 82. Comments explain *why*, not *what*

Bad:

```ts
// increment index
index += 1;
```

Good:

```ts
// xterm drops writes larger than one frame, so flush per animation frame
rafRef.current = requestAnimationFrame(flush);
```

Delete commented-out code. Git already keeps it. No `// TODO: fix later` without a ticket reference.

## 83. Never swallow errors

Bad:

```ts
try {
  await deploy();
} catch (e) {
  console.log(e);
}
```

Good:

```ts
try {
  await deploy();
} catch (error) {
  reportError(error);                      // observability
  toast.error(toUserMessage(error));       // user-facing, safe message
}
```

Two separate things: the **technical detail** goes to logging, the **human message** goes to the UI. Never show a raw stack trace or backend error string to the user.

Use typed errors from the API layer:

```ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
```

## 84. No floating promises, no unhandled async

Bad:

```ts
deploy();                       // fire and forget, errors vanish
useEffect(async () => { … });   // effects cannot be async
```

Good:

```ts
void deploy().catch(reportError);

useEffect(() => {
  let cancelled = false;

  void load().then(result => {
    if (!cancelled) setResult(result);
  });

  return () => { cancelled = true; };
}, [load]);
```

Prefer TanStack Query over hand-written async effects wherever it's server data.

## 85. Treat state as immutable

Bad:

```ts
project.tabs.push(tab);
setProject(project);          // same reference → no rerender
```

Good:

```ts
setTabs(prev => [...prev, tab]);
```

Never mutate props. Never mutate query cache data in place. Use the functional updater when the next value depends on the previous one.

## 86. Accessibility is part of "done"

```
every <img>                → meaningful alt, or alt="" if decorative
every input                → associated <label> (not placeholder-as-label)
icon-only button           → aria-label
dialog / sheet             → focus trap + Esc to close + focus restore on close
agent stream / toasts      → aria-live="polite"
interactive element        → reachable and operable by keyboard
color                      → never the only signal for status
focus ring                 → visible, never removed without a replacement
```

Use semantic HTML first (`button`, `nav`, `main`, `ul`). Reach for ARIA only when no element fits. shadcn/Base UI primitives already handle most of this — use them instead of hand-rolling a dialog.

## 87. Security rules

```
never  dangerouslySetInnerHTML with backend or agent output
never  secrets, API keys or DB credentials in the client bundle
never  target="_blank" without rel="noopener noreferrer"
always validate WebSocket payloads with Zod before routing them
always render preview output inside a sandboxed iframe
always HttpOnly + Secure + SameSite cookies for auth
```

Remember every `VITE_`-prefixed env variable is **public** and shipped to the browser. Anything secret stays on the backend.

Validate configuration once, at startup, and fail loudly:

```ts
// app/config/env.ts
const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_WS_URL: z.string().url(),
});

export const env = envSchema.parse(import.meta.env);
```

## 88. Tooling is not optional

```
ESLint        → typescript-eslint, react-hooks, jsx-a11y, import ordering
Prettier      → formatting is never a code-review topic
TypeScript    → strict, no build with type errors
Husky +
lint-staged   → lint + typecheck + test on staged files before commit
CI            → typecheck, lint, unit, component, E2E on every PR
```

The `react-hooks/exhaustive-deps` rule stays **on**. Don't disable it — fix the dependency, or move the value into a ref.

Enforce the dependency direction (Part 2, rule 6) with an ESLint import rule, so `shared → features` fails the build rather than depending on reviewer memory.

## 89. Commits, PRs, and definition of done

```
one logical change per commit
imperative subject, under 72 chars
no "wip", no "fixes", no emoji
never commit broken or unverified code
never mix formatting with behavior changes
```

Examples:

```
add deployment log virtualization
move websocket parsing into eventValidator
fix stale projectId in useProject effect
```

Keep PRs small and reviewable. A PR that touches 40 files gets a rubber stamp, not a review.

A change is done when:

```
[ ] types are strict, no any / ! / @ts-ignore
[ ] external data validated with Zod
[ ] loading, empty and error states exist
[ ] keyboard and screen-reader usable
[ ] no console.log left behind
[ ] tests cover the logic, not the implementation detail
[ ] lint + typecheck + tests pass locally
```

---

# Part 14 — Final Rule Sheet

## 90. Never / Always

**Never**

```
global React Context for rapidly changing state
WebSocket directly inside a random component
entire project object in every component
large lists without virtualization when needed
unnecessary useEffect chains
everything in Zustand
everything in useState
everything memoized
```

**Always**

```
server state      → TanStack Query
client state      → Zustand
local state       → useState
imperative objects→ useRef
forms             → React Hook Form
validation        → Zod
realtime          → dedicated realtime layer
large lists       → virtualization when needed
heavy work        → worker only when profiling proves it
```

## 91. Quick lookup

```
ROUTING                          → TanStack Router
SERVER DATA                      → TanStack Query
GLOBAL CLIENT STATE              → Zustand
LOCAL STATE                      → useState
COMPLEX LOCAL STATE              → useReducer
FORMS                            → React Hook Form
VALIDATION                       → Zod
IMPERATIVE OBJECTS               → useRef
SIDE EFFECTS                     → useEffect
EXPENSIVE DERIVED DATA           → useMemo
STABLE CALLBACKS FOR MEMO CHILD  → useCallback
NON-URGENT UI                    → useTransition
LAG-TOLERANT VALUE               → useDeferredValue
OPTIMISTIC UX                    → useOptimistic
REALTIME                         → dedicated WebSocket layer
HEAVY COMPONENTS                 → lazy()
ROUTE PREFETCH                   → preload / prefetch
LONG LISTS                       → TanStack Virtual
STATIC ASSETS                    → Vite imports
PUBLIC FIXED-ASSET URL           → public/
IMAGES                           → width + height + lazy + async decoding
NAVIGATION                       → <Link> internal, <a> external
ACTION                           → <button>
LOADING KNOWN LAYOUT             → skeleton
SHORT ACTION                     → spinner
LONG PROCESS                     → progress
EMPTY DATA                       → empty state
FAILED DATA                      → error state
HIGH-FREQUENCY UPDATE            → narrow store selector + rAF if needed
EDITOR / TERMINAL / IFRAME       → useRef
EXPENSIVE WORK                   → profile first → Web Worker only if justified
ANIMATION                        → CSS first; Motion for meaningful transitions
AUTH                             → HttpOnly Secure SameSite cookie
SECRETS                          → NEVER browser storage
```

## 92. Flow summary

```
REALTIME
WebSocket → ConnectionManager → EventRouter → Store / Query invalidation → small component update

FORMS
React Hook Form → Zod → API mutation → Query invalidation

IMPERATIVE
Monaco / xterm / iframe / WebSocket / DOM → useRef

PERFORMANCE
Profile → identify bottleneck → memo / virtualize / rAF / worker
```

---

**The most important rule stays the last one: don't optimize by habit.** First keep ownership clean. Then profile. Then introduce `memo`, `useMemo`, `useCallback`, virtualization, `requestAnimationFrame`, workers.
