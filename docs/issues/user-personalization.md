### Title
User Personalization: Per-Account Data Isolation, Requester Resolution & Notification Inbox

### Objective
Establish a per-account personalization layer so every user/guest sees only their own data and a different person never inherits prior on-screen state, resolve the active requester (authenticated user or guest), and ship a MongoDB-backed notification inbox with accurate, live red-dot state and clear feedback for invalid generation API keys.

### Assignee / Labels
- **Role:** Full-Stack Developer
- **Labels:** `frontend`, `backend`, `database`, `ux`, `security`, `notifications`, `auth`

### Tasks
- [ ] **Per-requester project ownership (server)** (`lib/apis/project/mongo/server.ts`, `lib/mongodb/models/project.ts`, `scripts/migrate-projects-ownership.mjs`):
  - Scope all project queries to the owning requester (`userId`); add and run the ownership migration.
- [ ] **Requester resolution** (`lib/auth/requester.ts`):
  - Resolve an authenticated Supabase user or a stable guest identity (device cookie) and expose `{ id, isGuest }`.
- [ ] **Scope client project state to the active requester** (`features/bom/store.tsx`, `app/bom/page.tsx`, `app/flow/page.tsx`):
  - Replace (don't merge) project lists on identity change so another user's projects are dropped.
- [ ] **Settings gating & generated titles** (`app/settings/page.tsx`):
  - Gate settings behind auth; improve generated project titles.
- [ ] **Ownership migration & issue tooling** (`.github/ISSUE_TEMPLATE/feature.md`, `scripts/migrate-projects-ownership.mjs`, `docs/issues/ai-usage-limit.md`):
  - Add the feature issue template and ownership migration script.
- [ ] **Notification data model & API** (`lib/mongodb/models/notification.ts`, `lib/apis/notification/*`, `app/api/v2/notifications/*`, `scripts/create-test-notification.mjs`, `scripts/migrate-notifications-shape.mjs`):
  - Per-action state group (`read`/`dismiss`/`delete`/`expand`/`redirect`/`external_link`/`callback`) plus `actionButtons`.
  - Server lib for listing, unread counting, dismiss/delete/expand, undelete, and a 15-day trash TTL with permanent deletion.
  - v2 routes (list + perform action + undelete); tester and shape-migration scripts.
- [ ] **Notification inbox UI & live bell** (`app/notification/page.tsx`, `components/NotificationBell.tsx`, `lib/apis/notification/events.ts`):
  - All/Unread/Read/Dismissed/Trash tabs, expand modal, and a live Trash "permanently deleted in" countdown.
  - Notification-change event bus so the bell refetches unread immediately after any read/dismiss/delete anywhere.
  - Per-entry dot hides on dismiss (matches server unread semantics).
- [ ] **Secure state reset on auth change & invalid API key feedback** (`features/auth/store.tsx`, `features/bom/store.tsx`, `features/visual-flow/store.tsx`, `features/inspire/store.tsx`, `lib/apis/generate/*`):
  - Bump a `sessionVersion` in `AuthProvider` on every login/logout/account switch and call `router.refresh()`.
  - Clear cached BOM/specs/PDF and in-progress prompt/uploaded files when the active identity changes.
  - Detect `API_KEY_INVALID` across the generation pipeline and return a dedicated error code.
  - Show a sticky toast with an "Open settings" action to `/settings?section=keys`; no console noise and no rethrow.
- [ ] **Settings API keys & UX** (`app/api/v2/settings/api-keys/route.ts`, `app/settings/page.tsx`, `components/UserMenu.tsx`):
  - Expose the API key management endpoint and wire the settings keys section.
  - Make the `UserMenu` theme row toggle the whole row.
- [ ] **Projects fallback UI** (`app/page.tsx`):
  - Render a visible "Couldn't load projects" message when the projects request fails.

### Acceptance Criteria
- [ ] All project data is scoped to the owning requester; a guest and a signed-in user never see each other's projects.
- [ ] The active requester resolves correctly for authenticated users and guests; guests get a stable device-bound identity.
- [ ] Logging out, in, or switching accounts clears the previous user's on-screen state (BOM, specs, PDF, prompt, uploaded files) and refetches scoped data.
- [ ] The notification inbox lists, tabs, expand modal, and live Trash ETA render; dismissed items leave the Unread tab and hide their entry dot.
- [ ] The bell red dot reflects the current account and updates immediately after any read/dismiss/delete performed anywhere in the app.
- [ ] An invalid generation API key shows a persistent toast linking to the settings keys section, with no console error and no rethrown error.
- [ ] The home page shows a fallback message when the projects request fails.
