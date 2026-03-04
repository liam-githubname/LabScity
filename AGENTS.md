## Tech Stack


* **Project:** LabScity (Social Media for Scientists)

* **Framework:** Next.js 15+ (App Router)

* **Language:** TypeScript (Strict Mode)

* **Styling:** Mantine UI (Core & Hooks). **NO Tailwind CSS.**

* **State Management:**

  * **Server:** TanStack Query (for data fetching) & Server Actions (for mutations).

  * **Client:** React Hook Form (form state) & Zustand (global UI state).

* **Notifications:** @mantine/notifications (show mutation success/error).

* **Validation:** Zod (Schema-First).

* **Backend/Auth:** Supabase.

* **Testing:** Vitest (Integration) & Playwright (E2E).


---


## Zod


* **Location:** `@/lib/validations/{feature}.ts`

* **Rule:** Export both the schema and the inferred TypeScript type.

* **Usage:**

  * **Frontend:** Pass schema to `useForm` via `zodResolver`.

  * **Backend:** Parse `formData` using the same schema in Server Actions.


---


## Server Actions and Mutations


* **Location:** `@/lib/actions/{feature}.ts`

* **Rule:** All file modifications (POST/PUT/DELETE) must use Server Actions.

* **Structure:**

  1. Validate input with Zod (`schema.parse()`).

  2. Check Auth (`supabase.auth.getUser()`).

  3. Perform DB operation.

  4. Revalidate path (`revalidatePath()`) if needed.

  5. Return `{ success: boolean, error?: string }`.

* **Security:** NEVER trust client inputs. Always re-validate on the server.

* **Return shape:** Return `{ success: boolean, data?: T, error?: string }`. For list/read endpoints, align `data` with types in `lib/types` (e.g. `GetFeedResult`).


---


## TanStack Query


* **Query keys:** Centralize in `@/lib/query-keys.ts`. Use a key factory (e.g. `feedKeys.list(filter)`) so server prefetch and client `useQuery` share the same key.

* **Server (page/layout):** Create a new `QueryClient` per request. Prefetch with `queryClient.prefetchQuery({ queryKey, queryFn })`. Call `dehydrate(queryClient)` and wrap the client tree in `<HydrationBoundary state={dehydratedState}>`.

* **Client:** `useQuery` with the same `queryKey` and a `queryFn` that calls the server action; data is hydrated on first render. For mutations, use `useMutation`; in `onSuccess` call `queryClient.invalidateQueries({ queryKey })` so the list refetches.

* **Loading/error:** Handle `isLoading`, `isError`, and `error` in the UI (e.g. "Loading feed...", error message).

* **Separation of Concerns:** Split components into `component.tsx` and `use-component.ts`, where the TanStack logic lives in the hook and the component handles the UI. Example: `src/components/feed/home-feed.tsx` vs `src/components/feed/use-home-feed.ts`.


---


## Passing Server Actions


* **Pattern:** The page (server component) imports server actions and passes them as props to the client component. The client component does not import actions directly for invocation; it receives them via props.

* **Example:** HomePage imports `createPost`, `createComment`, etc. from `@/lib/actions/post` and passes `createPostAction={createPost}` to HomeFeed. Same pattern as LoginForm (`loginAction`), SignupForm (`signupAction`).

* **Typing:** In the client component, type the prop with `typeof`: e.g. `type CreatePostAction = typeof createPost;` and `interface Props { createPostAction: CreatePostAction; }`.


---


## Client vs Server Components


* **Server Components (`page.tsx`, `layout.tsx`):**

  * Handle data fetching (initial load).

  * Define Metadata (SEO).

  * Pass data to Client Components via props.

  * **Restricted:** No `useState`, `useEffect`, or event handlers.

* **Client Components (`components/{feature}/*.tsx`):**

  * Mark with `"use client";` at the very top.

  * Handle interactivity (Forms, Buttons, Modals).

  * Keep these files small and focused.


---


## File Structure


* **Route Groups:** Use `(auth)` or `(home)` to isolate layouts without affecting URL paths.

* **Domain-Based Naming:** Group logic by feature, not file type.

  * ✅ `lib/validations/auth.ts`

  * ✅ `lib/actions/auth.ts`

  * ❌ `lib/schemas.ts` (Too generic)

* The `src/app/(app)` route group is for anything protected by login; `src/app/(auth)` is for unauthenticated routes.


---


## TypeScript


* **Strict Typing:** `any` is strictly forbidden. Use `unknown` if necessary and narrow types.

* **Inferred Types:** Prefer `z.infer<typeof schema>` over manually writing interfaces for data shapes.

* **Imports:** Always use absolute imports (`@/components/...`) instead of relative (`../../`).

* **Type-only imports:** Use `import type { Metadata }` (and similar) when a symbol is only used as a type.


---


## Styling


* **Theming:** **ALWAYS use colors from `theme.ts`** instead of hardcoded hex values. Use theme color props (e.g. `c="navy.5"`, `bg="gray.0"`) or `useMantineTheme()` hook for styles object. This ensures consistency and makes theme updates easier.

* **Responsiveness:** Use the `isMobile` hook from `src/app/use-is-mobile.ts` for mobile vs desktop layouts. For other sizes, use Mantine style props (e.g. `w={{ base: '100%', sm: 400 }}`) instead of media queries.

* **Components:** Prefer Mantine native components (`<Stack>`, `<Group>`, `<Paper>`) over generic `<div>` wrappers.

* **Styling Methods:** Prefer Mantine style props (e.g. `gap`, `w`, `align`, `c`, `bg`). For anything that cannot be done with Mantine style props, use inline styling. No CSS modules.


---


## Component Naming


* **Custom components:** All custom (project-specific) components must be prefixed with **"LS"** (e.g. `LSLoginForm`, `LSFeedCard`, `LSHeader`). This avoids confusion with Mantine and other library components.


---


## Documentation


* **JSDoc:** Use JSDoc comments for components, exported functions, and public APIs. Document purpose, props/parameters, and return values where helpful for maintainability and IDE support.

* **Additional comments — guidelines:**

  * **Complex logic:** Add a short comment above non-obvious algorithms, conditionals, or business rules so future readers understand intent.

  * **TODOs / follow-ups:** Use `// TODO: description` or `// FIXME: description` with a brief reason; avoid leaving unexplained TODOs.

  * **Workarounds:** If you must use a workaround (e.g. for a library bug or platform quirk), document why and link to an issue or ticket if available.

  * **Avoid noise:** Do not comment what the code already clearly expresses (e.g. `i++; // increment i`). Prefer clear naming over comments when possible.