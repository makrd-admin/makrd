# makrd

A community-driven, peer-to-peer 3D printing platform. See `PRODUCT.md` for the product
vision and `CLAUDE.md` for build rules, v1 scope, and progress log.

## Stack

- Next.js (App Router) + React + TypeScript, strict mode
- Tailwind CSS v4
- Supabase (Postgres, Auth, Storage) — browser + server client helpers in `lib/supabase/`
- Three.js + react-three-fiber (the loading screen's 3D mascot)
- Razorpay (buying points with real money)
- Package manager: pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). `/health` is a plain page to confirm
the app boots.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the real values.

**Supabase** (dashboard → **Project Settings → API**):

| Variable                        | Where to find it                                           | Notes                                      |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API → Project URL                       | Safe for the browser                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → Project API keys → `anon public`  | Safe for the browser; RLS protects data    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API → Project API keys → `service_role` | Server-only. Used by the Razorpay webhook. |

**Razorpay** (dashboard → **Settings → API Keys** / **Settings → Webhooks**):

| Variable                  | Where to find it                                                                   | Notes                                    |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| `RAZORPAY_KEY_ID`         | Settings → API Keys                                                                | Safe for the browser (Checkout needs it) |
| `RAZORPAY_KEY_SECRET`     | Settings → API Keys                                                                | Server-only. Creates orders via the API. |
| `RAZORPAY_WEBHOOK_SECRET` | Settings → Webhooks → add `/api/razorpay/webhook`, subscribe to `payment.captured` | Server-only. Verifies webhook requests.  |

Test-mode Razorpay keys work without full KYC/business verification — start there.

`.env.local` is git-ignored and must never be committed.

## Scripts

| Command             | Does                     |
| ------------------- | ------------------------ |
| `pnpm dev`          | Start the dev server     |
| `pnpm build`        | Production build         |
| `pnpm lint`         | ESLint                   |
| `pnpm typecheck`    | `tsc --noEmit`           |
| `pnpm format`       | Prettier, writes changes |
| `pnpm format:check` | Prettier, check only     |

## Supabase / migrations

This repo uses the Supabase CLI for local dev and migrations (`supabase/config.toml`,
`supabase/migrations/`). The full v1 schema — `profiles`, `printers`, `jobs`,
`points_ledger`, `points_purchases`, plus every RLS policy and RPC — is applied to the
live project; see `supabase/migrations/` for the history and `CLAUDE.md` for the data
model and progress log.

```bash
pnpm exec supabase start      # spin up local Supabase (needs Docker)
pnpm exec supabase db reset   # apply all migrations to the local DB
pnpm exec supabase migration new <name>   # create a new migration
```

To link to a real Supabase project for deploys: `pnpm exec supabase link --project-ref <ref>`,
then `pnpm exec supabase db push`.

## Deploying

Production deploys currently go out via the Vercel CLI (`vercel build --prod` then
`vercel deploy --prebuilt --prod`) rather than git-push-triggered deploys — see
`CLAUDE.md` for why (a Hobby-plan + private-repo + commit-author restriction blocks
git-triggered deploys until the repo goes public or the commit author matches the
Vercel account).
