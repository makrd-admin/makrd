# CLAUDE.md — [WORKING TITLE: replace with your project/brand name]

## What this project is
A community-driven, peer-to-peer 3D printing platform. Members submit print jobs;
other members who own 3D printers fulfil them. The network runs on a points/credits
economy — earn by printing for others (and later by recycling waste), spend to get
things printed or to access services.

The long-term product also covers filament recycling, automated print finishing, and
an ultra-affordable fully-modular printer. **But see "Scope" below: v1 is ONLY the
peer-to-peer web platform.** Fuller vision, pillars, and competitive positioning live
in `PRODUCT.md` — read that when you need product rationale; don't re-derive strategy here.

## Current goal (v1 / MVP)
Build the P2P marketplace website — the wedge. Get this core loop working end-to-end:

1. **Auth** — sign in with Google (Supabase Auth + Google OAuth provider).
2. **Register a printer** — a member adds a 3D printer (make/model + specs). Each printer
   gets a unique **model ID** and a **secret code word** (anti-fraud: proves the operator
   is really using the printer they claim; store the code word hashed).
3. **Submit a job** — upload a model file, pick material + quantity, see an estimated
   points cost.
4. **Accept a job** — providers browse open jobs and accept one.
5. **Points ledger** — requester is debited; provider is credited on completion.
6. **Status tracking** — submitted → accepted → printing → verification → completed.
7. **Dashboard** — for both roles: my jobs, my printers, my points balance.

## Tech stack — CONFIRM before building
Defaults chosen for a solo founder + Claude Code. Change any line and I'll adjust.
- Frontend: **Next.js (App Router) + React + TypeScript**
- Styling: **Tailwind CSS**
- Backend / DB / Auth / Storage: **Supabase** (Postgres, Auth, Storage, Row-Level Security)
- Auth: Supabase Auth with the **Google OAuth** provider
- Hosting: **Vercel** (frontend) + **Supabase cloud**
- Package manager: **pnpm**

## Data model (starting point — refine as we go)
- `profiles` (extends `auth.users`): role(s), display name, location, points_balance
- `printers`: owner_id, make, model, build_volume, materials[], model_id (unique),
  code_word_hash, status
- `jobs`: requester_id, model_file (Storage ref), material, quantity, est_points, status,
  provider_id (nullable)
- `points_ledger`: user_id, job_id, delta, reason, created_at

**Enforce Supabase Row-Level Security from day one** — users can only see/modify their own
rows, except public open-job listings.

## Out of scope for v1 — do NOT build yet
Filament recycling flows, resin/polishing service, the modular printer, CV quality
inspection, HQ logistics/delivery, and the slicer-integration connector. Design the schema
so these can slot in later, but do not implement them now.

## Conventions & guardrails
- TypeScript strict mode. Avoid `any` unless justified in a comment.
- **Never commit secrets.** Supabase keys live in env vars (`.env.local`). The service-role
  key is server-only — never ship it to the client.
- Every new table ships with its RLS policies in the same migration.
- Keep components small; colocate files by feature.
- Check whether a dependency is really needed before adding it.
- **Ask me before:** dropping/renaming DB columns, anything touching auth or security, or
  adding a paid third-party service.

## How to work with me
- I'm a solo, non-expert founder moving fast. Briefly explain trade-offs when a decision
  has lasting impact; otherwise just proceed.
- Prefer small, working, testable increments over big-bang changes.
- When you finish a chunk, tell me exactly how to run and test it.
- Keep this file updated as we build — log meaningful progress/decisions in the Progress
  Log below. `PRODUCT.md` covers vision/strategy and is only edited with my explicit
  approval; propose changes there rather than editing directly.

## Progress Log
_Newest first. One or two lines per entry — what changed and why, not a full diary._

- **2026-07-27** — Continuing solo. Fixed a real functional gap on `/jobs/[id]`: there
  was no way for the requester or assigned provider to actually get the uploaded model
  file — added a "Download model file" link via a signed Storage URL (1hr expiry),
  generated server-side so it only succeeds if the viewer passes the existing
  owner-or-assigned-provider Storage RLS policy. Also converted the two forms most
  likely to hit expected validation failures — job submission and printer registration —
  from throw-and-crash to `useActionState` with inline error messages (insufficient
  balance, bad material/quantity, duplicate model ID, etc. now show inline instead of
  swapping to the full error boundary); this closes the "known gap" noted in the
  previous entry for those two actions specifically. The five job-status RPCs
  (accept/start/verify/complete/cancel) still throw to `error.tsx` — lower value to
  convert since they're single-button actions, not forms with recoverable input.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  dev server smoke-tested.

- **2026-07-27** — Google sign-in confirmed working end-to-end on the deployed site.
  Working solo for a stretch while Mohit's away — built a real landing page (`/`, hero +
  how-it-works + roadmap teaser, redirects signed-in users to `/dashboard` as before),
  expanded `printers` with `location` and `description` columns (migration
  `20260727120000_add_printer_location_and_description`, applied + local file synced,
  `database.types.ts` updated and diffed against a fresh `generate_typescript_types` to
  confirm exact match) since proximity matters a lot for a P2P network and the
  registration form/list didn't have anywhere to put it. Added `/community` — a
  directory of every active printer on the network (any member, not just your own),
  which didn't exist before even though the RLS policy already allowed it; deliberately
  selects columns explicitly there instead of `select("*")` so `code_word_hash` is never
  fetched for printers that aren't the viewer's own. Added a root `app/error.tsx` so
  Server Action failures (insufficient balance, job already taken, etc.) show a message
  and a retry button instead of the default crash screen.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  dev server smoke-tested (`/`, `/community`, `/printers/new` all behave correctly
  signed out; landing page content confirmed rendering).
  **Known gap, not yet fixed:** thrown Server Action errors rely on Next.js forwarding
  the message to `error.tsx` as-is — this is Next's actual behavior for action errors
  (unlike render errors, which get redacted in production), but if that ever looks wrong
  in practice, the fix is converting the riskier actions (`submitJob`, `createPrinter`)
  to return `{ error }` via `useActionState` instead of throwing, for real inline form
  errors rather than a full error-boundary swap.

- **2026-07-27** — Migrated the Supabase project to a new account. The original project
  (`lbpzzecshsuriumwxesf`) was under `satyaanil1986@gmail.com`, which I don't have
  dashboard access to; switched to a project under `makrd.admin@gmail.com` instead
  (org "makrd-admin's Org", project **`hrmnsfkocxytkjjqzolz`**,
  `https://hrmnsfkocxytkjjqzolz.supabase.co`, region ap-northeast-1). Reconnected the
  Supabase MCP integration to the new account (`claude mcp add` + OAuth login — config
  now in `.mcp.json`, committed since it holds no secrets) and re-applied all 6
  migrations verbatim to the new (empty) project; `get_advisors` clean, same as before.
  Regenerated types (schema identical, so `database.types.ts` didn't need edits) and
  updated `.env.local` to the new URL/anon key. Verified `pnpm build` and a dev-server
  smoke test against the new project — same results as before the switch.
  **Not done yet:** Vercel's env vars still point at the old project — need updating to
  the new URL/anon key. The Google Cloud OAuth client's redirect URI also needs to be
  `https://hrmnsfkocxytkjjqzolz.supabase.co/auth/v1/callback` (not the old project's),
  and the Google Client ID/Secret need entering into *this* project's Authentication →
  Providers → Google (provider config is per-project, doesn't carry over). The old
  project (`lbpzzecshsuriumwxesf`) still exists, untouched, in case anything needs
  recovering from it — otherwise it can be deleted once the new one's confirmed working.

- **2026-07-27** — Built out the core v1 loop end-to-end: printer registration
  (`/printers`, `/printers/new` — model ID + scrypt-hashed code word), job submission
  (`/jobs/new` — uploads to a private `job-files` Storage bucket, live points estimate),
  the open-jobs marketplace (`/jobs` — browse + accept), per-job status flow
  (`/jobs/[id]` — accepted → printing → verification → completed/cancelled), and a
  dashboard (`/dashboard` — my printers, my jobs as requester/provider, points balance).
  Home (`/`) now redirects signed-in users straight to `/dashboard`.
  While building this, found and fixed real security gaps in the schema applied
  yesterday: `jobs` INSERT/UPDATE let a client set `est_points` directly (pay whatever
  you want), and `profiles` UPDATE let a client rewrite `points_balance` directly,
  bypassing the ledger entirely. Fixed via a server-authoritative pricing trigger, a
  trigger blocking direct `points_balance` writes from client requests, and replacing
  the broad jobs UPDATE policy with five narrow `SECURITY DEFINER` RPCs (`accept_job`,
  `start_printing`, `mark_verification`, `complete_job`, `cancel_job`) that are now the
  only way to mutate job state — each re-checks `auth.uid()` against the relevant role
  internally. `get_advisors` (security) clean after.
  Also discovered the v1 schema described as "applied" in the previous entry actually
  wasn't live — `public` schema was empty and `list_migrations` returned nothing (likely
  wiped when the project was restored from paused). Re-applied it, then layered the
  storage bucket + points-ledger-automation + hardening migrations on top; local
  migration files renamed/added to match what's actually live (6 migrations total).
  Regenerated `lib/supabase/database.types.ts` from the live schema (tables + new RPC
  functions) and wired the `Database` generic into both Supabase clients.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  dev server smoke-tested — public routes 200, protected routes correctly 307 to
  `/login` when signed out.

- **2026-07-26** — Wrote and applied the v1 schema migration (`profiles`, `printers`, `jobs`,
  `points_ledger`, all with RLS policies + a trigger that auto-creates a `profiles` row on
  signup) to the live Supabase project (`lbpzzecshsuriumwxesf`, restored from paused).
  `get_advisors` (security) came back clean — no missing-RLS or other lints. Local migration
  file renamed to match the remote-applied version
  (`supabase/migrations/20260726173040_init_schema.sql`). No local Docker available, so this
  was applied directly to the remote project via the Supabase MCP tools rather than tested
  against a local stack first.
  Also scaffolded Google OAuth end-to-end: `proxy.ts` (Next 16 renamed `middleware.ts` →
  `proxy.ts`, exported function must be named `proxy` not `middleware`) refreshes the Supabase
  session on every request via `lib/supabase/middleware.ts`; `/login` triggers
  `signInWithOAuth({ provider: "google" })`; `/auth/callback` exchanges the code for a
  session; `/auth/signout` (POST) signs out; `/auth/auth-error` handles failures; `/` is now a
  server component showing signed-in/out state. Added `[auth.external.google]` to
  `supabase/config.toml` for local-CLI parity (reads
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`/`_SECRET` env vars, not yet set anywhere). Created
  `.env.local` (gitignored) with the real project's public URL + anon key so the dev server
  could be smoke-tested against the live project. Verified: `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, `pnpm build` all pass; dev server smoke-tested — `/`, `/login`,
  `/health` all return 200, `/` correctly shows the signed-out "Sign in" state.
  **Not done yet / blocked on the user:** no Google Cloud OAuth client (Client ID + Secret)
  exists yet — that has to be created in Google Cloud Console (requires the user's Google
  account) and then entered in the Supabase dashboard under Authentication → Providers →
  Google, whitelisting the callback URL. Sign-in cannot be fully tested end-to-end until
  that's done. Session paused here — resume by walking through Google Cloud OAuth client
  setup next.
- **2026-07-26** — Scaffolded the repo from scratch: Next.js 16 (App Router) + TypeScript
  strict + Tailwind v4, `@supabase/supabase-js` + `@supabase/ssr` client helpers
  (`lib/supabase/client.ts` browser, `lib/supabase/server.ts` server), `.env.example`,
  ESLint + Prettier (incl. Tailwind class sorting), `pnpm` scripts (dev/build/lint/typecheck/
  format), Supabase CLI local workflow (`supabase/config.toml` + one empty placeholder
  migration), and placeholder `/` + `/health` pages. Verified: `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, `pnpm build` all pass; dev server smoke-tested (`/` and `/health` both
  return 200). Package manager: pnpm (confirmed). No schema written yet — next up is Google
  OAuth wiring, then the initial migration (`profiles`, `printers`, `jobs`, `points_ledger` +
  RLS).
- **2026-07-26** — Jules (separate scaffolding agent) was stopped before doing any work.
  Claude Code now owns the full build, starting from scratch: repo scaffold (Next.js +
  Tailwind + Supabase plumbing) followed by Google OAuth wiring.
- **2026-07-26** — Clarified division of labor: Jules is scaffolding the repo (Next.js/
  Tailwind/Supabase plumbing) in a separate PR; Claude Code picks up feature work afterward,
  starting with Google OAuth. Holding off on any scaffold/code changes until Jules's PR lands
  to avoid conflicts — repo currently has no `package.json` yet. **(Superseded — see entry
  above: Jules was stopped.)**
- **2026-07-26** — Repo initialized from `mohit` branch (origin/mohit): brought in
  `CLAUDE.md`, `PRODUCT.md`, and brainstorm images. No code yet. Set up Claude's working
  agreement: keep this log current, changes to `PRODUCT.md` require approval first.
