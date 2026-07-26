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
