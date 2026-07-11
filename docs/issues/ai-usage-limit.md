### Title
AI Usage Limit & User-Supplied API Key System (Supabase-backed)

### Objective
Introduce a quota/usage-limit system and user-controlled API key management so the app can gate AI generation (Specs → BOM → Flow) behind per-device/per-user daily limits while letting authenticated users supply their own provider keys. Settings, account management, and a shared page header/notification shell were added to support this, with all secrets handled server-side and encrypted at rest in Supabase.

### Assignee / Labels
- **Role:** Full-Stack Developer
- **Labels:** `frontend`, `backend`, `database`, `ux`, `security`, `ai`

### Tasks
- [ ] **Database Schema & Migrations:** Provision `rate_limits`, `profiles`, `user_api_keys`, and `user_settings` tables and the `increment_rate_limit` atomic RPC via `scripts/001_rate_limits.sql`, `002_profiles.sql`, `003_user_api_keys.sql`, `004_user_settings.sql`.
  - Track daily usage keyed by `identifier` (`user:<id>` / `guest:<deviceId>`) and `date`.
  - Store encrypted user API keys and JSON settings on the `profiles` row.
- [ ] **Rate-Limit Backend (`lib/rate-limit/`):** Implement `checkRateLimit` (status, no increment) and `consumeRateLimit` (atomic increment via RPC).
  - Guest quota = 3 generations/day; authenticated user quota = 5 generations/day.
  - Fail open (allow) when the store is unreachable; never leak secrets to the client.
- [ ] **Settings & Encrypted Key Backend (`lib/settings/server.ts`, `lib/ai/userKeyConfig.ts`, `lib/ai/providerConfig.ts`):** Persist and retrieve user settings and API keys.
  - Encrypt user keys with AES-256-GCM (`SETTINGS_ENCRYPTION_SECRET`) before storing in `profiles.encrypted_api_keys`.
  - Resolve provider access: prefer user-supplied keys, fall back to app-managed provider availability.
- [ ] **API Routes:** Expose `/api/v2/rate-limit/status`, `/api/v2/rate-limit/consume`, `/api/v2/settings`, `/api/v2/settings/api-keys`, `/api/v2/generate/providers`, `/api/v2/auth/delete`, and an auth callback route.
  - Generation routes (`specs`, `bom`, `visual-flow`) consume quota and gate on provider availability.
- [ ] **Device Tracking (`lib/device.ts`):** Generate/retrieve a persistent device UUID for guest quota identification.
- [ ] **Settings UI & State (`features/settings/store.tsx`, `app/settings/page.tsx`):** Build the settings page for provider/model selection, API key entry, and notification preferences, backed by a Supabase store.
- [ ] **Account & Auth UI (`components/AccountModal.tsx`, `components/AuthModal.tsx`, `components/UserMenu.tsx`, `features/auth/store.tsx`):** Add login/logout, password change, and account deletion flows.
- [ ] **Shared App Shell (`components/PageHeader.tsx`, `components/MobileShell.tsx`, `components/BottomNav.tsx`, `components/NotificationBell.tsx`, `components/ThemeProvider.tsx`, `components/InfoTooltip.tsx`):** Introduce a reusable `PageHeader` adopted across pages and wire notifications/theme into the layout.
- [ ] **Navigation Guard (`components/navigation/NavigationGuard.tsx`):** Warn users about unsaved settings changes before navigating away; integrate into the app shell.
- [ ] **Generation Wiring & Home Polish (`app/page.tsx`, `app/bom/page.tsx`, `app/flow/page.tsx`, `app/cart/page.tsx`, `lib/apis/generate/*`):** Connect provider/model selection and quota consumption into generation; update home generate section and prompt hints; add cancellation and hardened retries.
- [ ] **Tooling & Config:** Add `proxy.ts`, update `env.sample` (rate-limit/encryption secrets), and polish header/home tooling.

### Acceptance Criteria
- [ ] A guest device is limited to 3 AI generations per day and an authenticated user to 5 per day, with the counter visible via `/api/v2/rate-limit/status`.
- [ ] On exceeding the daily quota, generation requests are rejected (consume returns `allowed: false`) and the user is prompted to supply their own key or wait.
- [ ] Authenticated users can store their own provider API keys; keys are encrypted at rest and never exposed to the browser.
- [ ] Supplying a valid personal key allows generation that bypasses the app quota and uses the user's key.
- [ ] Generation routes (Specs → BOM → Flow) reliably gate on provider availability and consume quota atomically without double-counting.
- [ ] Settings, account (login/logout/password/delete), notifications, and the shared `PageHeader` render correctly across pages.
- [ ] The navigation guard warns before leaving with unsaved settings changes.
- [ ] Database migrations apply cleanly and the `increment_rate_limit` RPC prevents race-condition over-counting.
