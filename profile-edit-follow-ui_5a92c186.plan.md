---
name: profile-edit-follow-ui
overview: Implement edit profile and follow/unfollow features on the profile page with Zod-validated server actions and Mantine UI refinements.
todos:
  - id: add-profile-validation-schema
    content: Create updateProfileSchema and related types in src/lib/validations/profile.ts and extend User type if needed.
    status: pending
  - id: implement-update-profile-action
    content: Implement updateProfileAction in src/lib/actions/profile.ts to upsert profile data and update names.
    status: pending
  - id: refactor-profile-hero-api
    content: Refine LSProfileHero props to support occupation/workplace and conditional edit vs follow button.
    status: pending
  - id: wire-edit-profile-form
    content: Connect LSEditProfilePopover to useUserProfile data and updateProfileAction with React Query + notifications.
    status: pending
  - id: implement-toggle-follow-action
    content: Add toggleFollowSchema and toggleFollowAction in src/lib/actions/profile.ts for follows table toggling.
    status: pending
  - id: connect-follow-ui
    content: Use isOwnProfile and isFollowing to drive Follow/Unfollow button via React Query mutation and LSProfileHero.
    status: pending
  - id: pass-real-profile-data
    content: Pass real occupation/workplace/about/skills data into LSProfileHero and wrap view in gray.0 background.
    status: pending
  - id: avatar-fallbacks-and-view-selector
    content: Improve Avatar fallbacks in mini profile and keep LSViewSelector unused until backend support exists.
    status: pending
isProject: false
---

# Profile edit & follow features

## Context & adjustments

- **Existing structure**: The profile route is hydrated via `page.tsx` into the client `LSProfileView`, which renders separate mobile/desktop layouts and a presentational `LSProfileHero` with an inline `LSEditProfilePopover` stub.
- **Data model**: Profile data is currently fetched via `getUser` (from the `users` table / profiles view) and exposed as `User` in `lib/types/feed`. Auth signup already captures `occupation` and `workplace` in Supabase metadata.
- **Planned changes**: Introduce a dedicated profile validation schema and server actions for updating profile fields and toggling follows, then wire these into the existing React Query + Mantine UI patterns.
- **Plan tweak**: Keep the existing mobile/desktop split for now (to avoid a large refactor) but make them share an updated `LSProfileHero` API and consistent background styling. Also, do not introduce `LSViewSelector` into the live layout yet since it has no backend support.

## Commit-sized steps

### Commit 1: Add profile validation schema

- **Files**: `src/lib/validations/profile.ts`, `src/lib/types/feed.ts` (User extension if needed).
- **Changes**:
  - Create `updateProfileSchema` with fields: `firstName`, `lastName`, `about`, `workplace` (replacing `institution`), `occupation` (replacing `role/profession`), `fieldOfInterest`, and `skills` (string array), using sensible min lengths and max lengths.
  - Export `UpdateProfileValues = z.infer<typeof updateProfileSchema>`.
  - If the profile API already exposes these fields, extend the `User` interface to include them (e.g. `about?: string`, `occupation?: string`, `workplace?: string`, `field_of_interest?: string`, `skills?: string[]`) to keep type-checking aligned with what `getUser` returns.

### Commit 2: Implement profile update server action

- **Files**: `src/lib/actions/profile.ts`.
- **Changes**:
  - Import `z` and `updateProfileSchema`.
  - Add `updateProfileAction(input: UpdateProfileValues, supabaseClient?: SupabaseClient)` that:
    - Validates `input` with `updateProfileSchema`.
    - Uses `createClient` + `supabase.auth.getUser()` to get the authenticated user id; returns `{ success: false, error: "Authentication required" }` if missing.
    - Performs an upsert/update to the `public.profile` table for extended profile data (`about`, `workplace`, `occupation`, `field_of_interest`, `skills`), keyed by the current user id.
    - Optionally updates the canonical name source (e.g. `public.users` or a `profiles` view) for `first_name` and `last_name` if those are stored separately.
    - Returns a consistent `{ success: boolean, error?: string }` structure, mapping `z.ZodError` and Supabase errors to user-friendly messages.

### Commit 3: Refactor LSProfileHero and edit profile popover API

- **Files**: `src/components/profile/ls-profile-hero.tsx`.
- **Changes**:
  - Update `LSProfileHeroProps` to accept:
    - `profileName`, `profileResearchInterest`, `profileAbout`, `profileSkills`, `profileHeaderImageURL`, `profilePicURL` (as today) plus:
    - `occupation?: string`, `workplace?: string` (used in place of the old role/institution pairing).
    - `isOwnProfile: boolean`.
    - `onOpenEditProfile?: () => void` (for edit) **or** `onToggleFollow?: () => void` and `isFollowing?: boolean` (for follow/unfollow) – choose one API and keep the hero purely presentational.
  - Replace the hard-coded `profileRole` / `profileInstitution` line with `occupation` and `workplace` in the subtitle.
  - Move `LSEditProfilePopover` to be controlled via props instead of owning profile state directly, or split it into a separate component that receives `initialValues`, `onSubmit`, and loading/error props from the parent.
  - Render the trailing action area conditionally:
    - If `isOwnProfile` is true, show the edit control (button that opens the modal/popover wired by the parent).
    - If `isOwnProfile` is false, show a button whose label derives from `isFollowing` ("Follow" vs "Unfollow"), with click delegated to `onToggleFollow`.

### Commit 4: Wire edit profile form to data & server action

- **Files**: `src/components/profile/ls-profile-hero.tsx` (popover component), `src/components/profile/ls-profile-view.tsx`.
- **Changes**:
  - In `LSProfileView` (or a small new hook like `useEditProfile(userId)`), derive the editable profile values from `useUserProfile(userId).data`, mapping backend fields into `UpdateProfileValues` (including `workplace` and `occupation`).
  - Pass `initialValues` into `LSEditProfilePopover` and configure `useForm` to be controlled and typed with `UpdateProfileValues` instead of `any`.
  - On form submit, call `updateProfileAction` via a `useMutation` that:
    - On success, invalidates `profileKeys.user(userId)` so the profile hero and other consumers re-fetch.
    - Shows a success Mantine notification.
    - On error, shows an error notification using the message from the server.
  - Ensure the form field names and labels now use `Workplace` and `Occupation` instead of `Institution` / legacy role terminology.

### Commit 5: Add follow toggle schema and server action

- **Files**: `src/lib/validations/profile.ts`, `src/lib/actions/profile.ts`.
- **Changes**:
  - Add a simple `toggleFollowSchema = z.object({ targetUserId: z.string().min(1) })` and `ToggleFollowValues` type.
  - Implement `toggleFollowAction(input: ToggleFollowValues, supabaseClient?: SupabaseClient)` that:
    - Validates `targetUserId`.
    - Uses `supabase.auth.getUser()` to find the current (follower) user id.
    - Checks the `follows` table for an existing row where `follower_id = currentUserId` and `following_id = targetUserId`.
    - If a row exists, deletes it (unfollow); otherwise inserts a new row (follow).
    - Returns `{ success: true, data?: { isFollowing: boolean } }` or `{ success: false, error }` with solid error handling.

### Commit 6: Hook follow/unfollow into LSProfileView and hero

- **Files**: `src/components/profile/use-profile.ts`, `src/components/profile/ls-profile-view.tsx`, `src/components/profile/ls-profile-hero.tsx`.
- **Changes**:
  - Derive an `isFollowing` boolean for the viewed profile user by checking `useUserFollowers(userId).data` (e.g. `some(follower => follower.user_id === currentAuthedUserId)`), or add a convenience hook `useIsFollowing(viewedUserId)` that wraps this logic.
  - In `LSProfileView`, create a `useMutation` around `toggleFollowAction` that on success invalidates `profileKeys.followers(userId)` (and any other relevant keys) and shows success/error notifications.
  - Pass `isOwnProfile`, `isFollowing`, and an `onToggleFollow` callback down into `LSProfileHero` so that the hero’s button reflects the current follow state.

### Commit 7: Pass real data into LSProfileHero and align background styling

- **Files**: `src/components/profile/ls-profile-view.tsx`.
- **Changes**:
  - Replace the hardcoded placeholders (`"profileRole n/a"`, `"profileInstitution n/a"`, `"profileResearchInterest n/a"`, etc.) with fields from `profile` (e.g. `profile.occupation`, `profile.workplace`, `profile.research_interests?.[0]`, `profile.about`, `profile.skills`).
  - Ensure `profilePicURL` uses `profile.avatar_url` (or equivalent) and add safe fallbacks.
  - Wrap the entire profile view (around the mobile/desktop branch) in a Mantine `Box` with `bg="gray.0"` and `mih="100vh"` so the profile background matches the Home feed.

### Commit 8: Avatar fallbacks and LSViewSelector handling

- **Files**: `src/components/profile/ls-mini-profile.tsx`, `src/components/feed/post-card.tsx`, `src/components/feed/post-comment-card.tsx`, `src/components/profile/ls-view-selector.tsx`.
- **Changes**:
  - Update `LSMiniProfile`’s `Avatar` to derive initials from `posterName` (similar to `PostCard` and `PostCommentCard`) so that it displays initials when `posterProfilePicURL` is missing.
  - Verify existing `Avatar` usage in `PostCard` and `PostCommentCard` continues to show initials correctly; adjust only if the new profile data introduces regressions.
  - Keep `LSViewSelector` unused for now (no imports into the profile view), preserving the component for future Publications/Projects support without adding dead UI to the current profile page.

