PROJECT STACK AND STANDARDS (follow on every file you write)

Stack — fixed, do not substitute:
- Next.js App Router, React 19, TypeScript strict, Tailwind CSS.
- Database: MongoDB through Mongoose. One model per file in `src/models/<kebab-name>.ts`, exported as a named export (`export const Product`). Always connect with `await connectDb()` from `@/lib/mongoose` before a query in route handlers, server actions and server components. Never call `mongoose.connect` yourself and never use Prisma, SQL or `DATABASE_URL`.
- Auth: Auth.js (`next-auth`). Passwords are hashed and compared with `bcryptjs` (cost 12). Put the hash on a field with `select: false`, never return it from an API, never log it. Check the session in `src/middleware.ts` and again inside every protected route handler and server action. When the dependency manifest includes Google OAuth, configure the Auth.js Google provider with server-only `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and use Auth.js state, nonce, PKCE, callback, and token validation. For this Next.js App Router architecture, the Google authorized redirect URI is the deployed application origin followed by `/api/auth/callback/google`; never expose the client secret to browser code.
- Validation: Zod at every boundary — route handlers, server actions, forms, env. Derive types with `z.infer` and `InferSchemaType`; never write the same shape twice.
- Server data on the client: TanStack Query (`useQuery`, `useMutation`). One query-key factory per feature, a `staleTime` on every query, invalidate only the keys a mutation changes. Server Components read the models directly instead.
- Client state: Zustand for global UI state only (sidebar, theme, or a cart when the product sells goods). Select the smallest slice, use `useShallow` for several fields. Never copy server data into a store.
- Forms: `react-hook-form` with `zodResolver`.
- Dependencies: Add packages only when a concrete requirement needs them. Do not install packages in the scaffold or before they are needed. Before installing a package, check whether the existing stack (Next.js App Router, Server Actions, native React state, Zod) already covers the functionality. Never install stripe unless there is an active payment workflow; never install next-auth or bcryptjs unless the project has user authentication; never install zustand unless complex global client state is needed. Install only packages that are already in `package.json` or on the allowlist: next-auth, bcryptjs, mongoose, zod, zustand, @tanstack/react-query, react-hook-form, @hookform/resolvers, stripe, lucide-react, clsx, tailwind-merge. Write small helpers yourself instead of adding anything else. After implementation, audit dependencies for unused additions.

Design system and UI components (already in `src/components/ui/`, import them, never rebuild them):
- Theme: colours and fonts come from the theme tokens in `src/app/theme.css`. Use `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-accent`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-card`, `rounded-lg`, and `font-heading` for display text. Never write hex or `rgb()` colours or font names in components, and never edit `theme.css`.
- Feedback: call `toast.success("Saved")` or `toast.error(message)` after a form submit, save, or delete. `<Toaster />` is already in the root layout; do not add a second one.
- Popups: use `Modal` for any dialog, details view or form popup and `ConfirmModal` before destructive actions. Never build a popup with a fixed-position div.
- Loading: every route that loads data gets a `loading.tsx` using `PageSkeleton` (variant `page`, `cards`, `table` or `detail`). Use `Skeleton` for one block, `Spinner` for an inline wait, and `isLoading` on a `Button` while its request runs.
- Content: use `Carousel` only when this task lists a carousel or a gallery. Use `Testimonials` only when this task lists a testimonial section. Do not invent quotes, names, ratings, products, prices, or a cart.

TypeScript:
- No `any`, no non-null `!`, no `@ts-ignore`. Use `unknown` and narrow or parse with Zod.
- `import type` for type-only imports. Named exports; default export only where Next.js requires it (pages, layouts, route files).
- Handle `undefined` from indexed access. Model states as discriminated unions, not several booleans.

React:
- Components render, hooks hold logic. Keep components under 150 lines and files under 250 lines, one job per file, kebab-case file names (PascalCase for component files).
- Server Components by default. `"use client"` goes only on the smallest interactive leaf, as the first line.
- Derive values during render. Do not sync derived data with `useEffect` + `setState`. Every effect cleans up.
- Optimize on purpose: `memo` on list-row components, `useMemo` for sorting/filtering/grouping lists, `useCallback` only for functions passed to memoized children or used in effect dependencies. Do not create new objects, arrays or inline functions as props of memoized children. No memoization anywhere else.
- Lists use stable ids as keys, never the array index. Long lists over about 100 rows are virtualized.
- Lazy-load heavy components with `next/dynamic`. Use `next/image` and `next/font`.
- Every data view has four states: loading, empty, error and success. Show the server's error message.
- Every input has a label, icon-only buttons have `aria-label`, everything works by keyboard.

API and data:
- Route handlers parse the body with Zod, return `{ "error": { "code", "message", "details" } }` on failure, and use 400, 401, 403, 404, 409, 422 correctly.
- Validate ids with `isValidObjectId` before querying. Return only the fields the client needs.
- Secrets live in `src/env.ts` (Zod-validated) and `.env.local`. Nothing secret in `NEXT_PUBLIC_*`.
- Seed data uses only facts the task provides. Do not invent prices, reviews, client names, or a sample brand. Never use "Item 1" or lorem ipsum.

Working efficiently on large builds:
- Plan the files first, then write each complete file with one `write_file` call. Do not re-read files you just wrote or files that did not change.
- Read only what you need. Use `list_files` once per folder, not repeatedly.
- Fix every error a verification report lists in one pass, then stop. When the task is done, stop calling tools.
- Binary images (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.ico`) are not text. Do not `read_file` them and do not create or rewrite them with python, bun, npx, sed, or file. Use the path the task gives you. A missing image is a neutral placeholder element with its alt text.
