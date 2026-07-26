# makrd

A community-driven, peer-to-peer 3D printing platform. See `PRODUCT.md` for the product
vision and `CLAUDE.md` for build rules, v1 scope, and progress log.

## Stack

- Next.js (App Router) + React + TypeScript, strict mode
- Tailwind CSS v4
- Supabase (Postgres, Auth, Storage) — browser + server client helpers in `lib/supabase/`
- Package manager: pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). `/health` is a plain page to confirm
the app boots.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the real values from the Supabase dashboard
(**Project Settings → API**):

| Variable                        | Where to find it                                           | Notes                                    |
| ------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project Settings → API → Project URL                       | Safe for the browser                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → Project API keys → `anon public`  | Safe for the browser; RLS protects data  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Project Settings → API → Project API keys → `service_role` | Server-only. Never expose to the client. |

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
`supabase/migrations/`).

```bash
pnpm exec supabase start      # spin up local Supabase (needs Docker)
pnpm exec supabase db reset   # apply all migrations to the local DB
pnpm exec supabase migration new <name>   # create a new migration
```

`supabase/migrations/` currently has one placeholder migration — the actual v1 schema
(`profiles`, `printers`, `jobs`, `points_ledger` + RLS policies) is not written yet; see
`CLAUDE.md` for the data model and current build status.

To link to a real Supabase project for deploys: `pnpm exec supabase link --project-ref <ref>`,
then `pnpm exec supabase db push`.
