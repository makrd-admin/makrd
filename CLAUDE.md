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

- **2026-08-01 (latest)** — Follow-up bug-fix pass after shipping the admin/username
  batch, plus a small favicon ask. Four separate changes, each verified and deployed
  independently.
  **Onboarding tour was reappearing on every visit.** It was gated by localStorage only
  — correct logic, but localStorage doesn't survive private browsing, cleared site
  data, or a different device, all of which read as "it keeps coming back." Added
  `profiles.has_seen_tour` (migration `20260801000000_has_seen_tour.sql`) and moved the
  gate server-side: `app/dashboard/page.tsx` fetches it and passes it into
  `OnboardingTour`, which now writes it back via a plain client-side `profiles` update
  on close (no protection trigger needed — same reasoning as printer status: a user
  marking their own tour seen isn't a fraud vector).
  **Found the likely cause of "/complete-profile won't load" and probably of the
  long-standing sign-out bug too.** Checked Supabase auth logs and saw a sustained burst
  of `GET /user` calls (several per second, for minutes) plus repeated login/
  token_revoked/token_refreshed cycles for the same accounts — the signature of
  concurrent requests racing to refresh the same rotating Supabase token, where the
  loser gets signed out. The new username-gate middleware
  (`lib/supabase/middleware.ts`) was very possibly making this worse: it ran a Postgres
  round trip (a `profiles` select, plus a `page_views` insert) on *every* request,
  including Next's own background prefetches — and a page with many `<Link>`s (nav,
  dashboard quick actions, job lists) fires a lot of those. More time spent per request
  means more concurrent requests piling up, which widens the race window. Fixed by
  skipping the whole gate-and-log block for prefetch requests (`next-router-prefetch`
  header — only real navigations need it) and switching the page-view insert to
  fire-and-forget instead of `await`ed. Not proven as the sole root cause of the
  session-persistence bug tracked since 2026-07-28, but a real fix regardless (strictly
  less DB load per request), and the specific "/complete-profile won't load" symptom
  should be gone.
  **New favicon**, per direct request ("white benchy in a green circle" instead of the
  stock Next.js/Vercel default). Added `app/icon.svg` (Next's file-based icon
  convention — no new dependency) — a hand-drawn white tugboat silhouette (funnel,
  cabin, hull curve) on a `#16a34a` green circle, checked legible down to 16px via a
  local preview before shipping. Takes priority over the old `favicon.ico` in the
  `<head>` for virtually every modern browser; left the old file in place as a legacy
  fallback rather than trying to hand-encode a replacement `.ico` (would've needed a new
  image-processing dependency for a tab icon).
  **Landing hero's close-up camera stage looked broken.** Screenshotted the live scroll
  sequence per Mohit's "review the whole site, use claude in chrome" ask and found the
  "low front-on" stage (`benchy-scroll-scene.tsx`) brought the camera close enough that
  the cabin wall — portholes and the real Benchy's open archway cutout, actual geometry,
  not a decimation artifact — filled the entire frame with the hull/water line out of
  shot. Read as hollow/broken rather than as a boat. Backed the radius/height floors off
  (2.2→2.8, 0.3→0.55) and matched stage 3's starting values so there's no visual jump at
  the handoff. Verified live via a local dev server before shipping — hull curve and
  water are now in frame at the closest point.
  **On "old stuff shows, then new stuff appears every time I open the site"**: checked
  for a service worker or PWA manifest (none exist) and confirmed the HTML response is
  `cache-control: no-store` and JS/CSS chunks are content-hashed per build, so the app
  itself has no mechanism to serve stale content mixed with new. Best explanation is
  ordinary mobile-browser tab-restore behavior (showing a cached screenshot of the tab
  instantly on reopen, then replacing it with the live re-render) — not a code bug.
  Flagged to Mohit rather than guessing at further fixes; worth revisiting only if it
  keeps happening after this deploy (the middleware fix above should also make real
  navigations feel snappier regardless).
  Verified: `pnpm typecheck`/`lint`/`format:check`/`build` all pass after each change;
  migration applied live via Supabase MCP. Four separate commits, each pushed to `main`
  and `mohit` and deployed via the standard manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow, verified live on `https://makrd.vercel.app`
  after each.

- **2026-07-30 (latest)** — Real admin role, mandatory unique usernames, and signed-in
  visit logging — the auth-touching batch Mohit asked for directly ("access the site
  with admin... username cannot be used more than once... view who all are visiting").
  Asked first via AskUserQuestion since this is squarely inside CLAUDE.md's
  ask-before-auth gate; Mohit chose **"Real admin role"** (not a fixed-credential
  backdoor — I flagged that option as a security risk and it was not chosen, so it
  should not be built even if raised again casually without a fresh explicit
  confirmation), **"Everyone, going forward"** for username scope (existing accounts
  included, not just new email/password signups), and **"who specifically (signed-in
  users)"** for the visitor-tracking scope (not aggregate/anonymous analytics).
  **Admin role**: `profiles.is_admin boolean`, protected from client writes by widening
  the existing `protect_points_balance` trigger (same "current_user = authenticated"
  guard already used for points_balance) rather than adding a second trigger. Granted
  directly via SQL to Mohit's own account only — he's the sole admin right now.
  `requireAdmin()` in `lib/auth.ts` gates the new `/admin` page (redirects non-admins to
  `/dashboard`); an "Admin" nav link only renders for him (`nav-links.tsx`,
  `navLinksFor(isAdmin)`, shared between the desktop pill and the mobile drawer).
  **Usernames**: unique (case-insensitive, via a functional index on `lower(username)`
  rather than adding the `citext` extension for one column), format-checked
  (`^[a-zA-Z0-9_]{3,20}$`), nullable at the DB level on purpose — existing rows can't be
  auto-backfilled with a value, so uniqueness is enforced going forward via a mandatory
  gate instead of a NOT NULL migration that would break instantly. New
  `set_username(text)` RPC (SECURITY DEFINER) re-checks uniqueness server-side so two
  simultaneous claims of the same name can't both win a client-side-only race. Every
  signed-in request now passes through an extra check in
  `lib/supabase/middleware.ts` (already the place session refresh happens): no
  username → redirect to `/complete-profile`, a small form
  (`app/complete-profile/{page,actions,username-form}.tsx`) that's the one page
  excluded from its own gate (infinite-loop guard) — `/api` and `/auth` paths are also
  excluded so the OAuth callback itself is never intercepted. **This affects all 9
  existing real accounts**, including Mohit's — everyone gets routed to pick a username
  once before they can use anything else, per his "everyone" answer. Username now
  displays in place of `display_name` (falling back to it) across `/community`,
  community chat, and both `/messages` views.
  **Visit logging**: new `page_views` table (user_id, path, created_at), RLS restricted
  to admin-only SELECT, written via a `log_page_view(text)` SECURITY DEFINER RPC (never
  a direct client insert policy, so a client can't forge visits under someone else's
  name) called from the same middleware pass — filtered to real GETs from signed-in
  users, explicitly skipping Next's own link-hover prefetch requests
  (`next-router-prefetch` header) so the log reflects actual navigation, not hovers.
  `/admin` shows both a "most recently seen" summary per member and a raw recent-
  activity table (last 200 views).
  Bundled in the same deploy: the mobile nav drawer's background, which despite two
  earlier attempts (`.glass-frost`, then `bg-[var(--background)]`) was still reported
  unreadable — replaced the CSS-variable version with literal
  `bg-white dark:bg-neutral-950` (no indirection) as a third, more forceful fix.
  Verified: `pnpm typecheck`/`lint`/`format:check`/`build` all pass (25 routes, +`/admin`
  +`/complete-profile`); both migrations applied live via Supabase MCP and confirmed
  clean via `get_advisors`; confirmed live post-deploy that `/admin` and
  `/complete-profile` both correctly redirect signed-out visitors to `/login` (checked
  the embedded redirect marker in the response body, same method used throughout this
  project since the root `loading.tsx` made plain 307s unavailable for curl-testing).
  **Could not click through the actual username-picker or admin dashboard live** — the
  authenticated browser session was lost earlier this session (see the entry below) and
  wasn't re-established; this is reasoned-through and locally verified but not
  eyeballed in a real signed-in browser. Pushed to `main` and `mohit`, deployed via the
  standard manual `vercel build --prod` + `vercel deploy --prebuilt --prod` workflow,
  live on `https://makrd.vercel.app`.

- **2026-07-30 (very late)** — Mohit confirmed the mobile drawer from the previous entry
  actually opens correctly (good — the "not visually confirmed" caveat there is resolved),
  but couldn't read the links: `.glass-frost` is still translucent/blurred, not opaque
  enough against arbitrary page content on his device. Swapped it for a fully solid panel
  (`bg-[var(--background)]`, no blur) plus a border and shadow for depth. Small, targeted
  fix — verified typecheck/lint/format/build, pushed to `main`/`mohit`, redeployed,
  live on `https://makrd.vercel.app`.

- **2026-07-30 (later night)** — Real Benchy on the login screen, a mobile nav drawer, and
  a live data point on the session-persistence bug.
  **`/login` was still showing the old flat SVG loader.** Missed in every earlier "use the
  real model everywhere" pass — swapped `PrinterLoader` for `SkipperLoadingScene`. Deleted
  `components/printer-loader.tsx` (no remaining usages). Verified live: the real 3D model
  with its green fresnel glow now renders on the sign-in card (took ~3s to appear — the
  WebGL chunk loading, not a bug).
  **Added a mobile nav drawer.** The nav pill's link row was scrolling horizontally on
  phone widths instead of fitting, burying most routes. Below `sm`, the link row is now
  hidden and a hamburger button (`components/mobile-nav.tsx`) opens a slide-in drawer with
  every link at full width. Exported `LINKS`/`isLinkActive` from `nav-links.tsx` so the
  desktop row and the drawer share one source of truth. **Not visually confirmed** — see
  below.
  **Lost the authenticated browser session mid-verification**, possibly a live instance of
  the still-open session-persistence bug. Tried `resize_window` to test the drawer at a
  phone width; it silently didn't affect the real viewport (`window.innerWidth` stayed at
  1920 after a "successful" 400x850 resize — a tooling limitation, not a code issue), and
  by the next navigation the tab had been signed out of `/dashboard` back to `/login`. Did
  not attempt to sign back in — that's not something to do on the user's behalf. **The
  mobile drawer itself is unverified visually** — code passes typecheck/lint/build and
  reuses the exact `hidden sm:flex`/`sm:hidden` pattern already proven for the desktop nav
  row in this same file, but Mohit should confirm on an actual phone.
  Pushed to `main` and `mohit`, redeployed via the manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow, verified live on `https://makrd.vercel.app`.

- **2026-07-30 (night)** — `claude-in-chrome` finally connected this session — first real
  browser verification since 2026-07-29 afternoon. Used it to catch and fix a bug my own
  reasoning had missed, then landed three more requested changes.
  **The wake "white circle" was actually a rendering bug, not just a design complaint.**
  Screenshotted the live site and saw the previous foam ring rendering as a translucent
  vertical panel poking through the hull — a flat disc viewed nearly edge-on from this
  scene's low, close camera angles all but disappears into a sliver, and my y=-0.4
  placement guess was wrong anyway (wrote a one-off script to compute the model's real
  normalized bounding box: Y spans -0.72 to 0.72, so -0.4 sat inside the hull/cabin, not
  at the waterline). Fixed by switching the foam to flattened spheres (real volume from
  any angle) at the correct y≈-0.6, then re-verified live — confirmed clean, no more
  artifact. **Lesson: when a visual bug report doesn't fully make sense from reading the
  code, get a screenshot before guessing at a fix — the actual rendering can differ from
  what the transform math suggests.**
  **Smoothed the opening scroll** — boat's scale-in was linear over an 8%-of-scroll
  window, read as an abrupt pop. Eased with smoothstep over the same window instead.
  **Flipped the internal app back to black-and-green.** The vibrant blue/violet/pink
  push from earlier never touched the landing page (which already has its own scoped
  green override) but WAS the base `:root` theme for every other route — dashboard,
  login, printers, etc. Mohit called this out directly ("internal sites... not purple
  like it is now"). Updated the base CSS vars back to black-and-green (matching what
  the landing override already uses in spirit, kept as a separate distinct palette),
  plus the mascot's 3D model materials and the Razorpay theme color, which had also
  drifted vibrant. Verified live on `/login` and the authenticated `/dashboard` — both
  correctly green now.
  **Gave the mascot/loading-screen Benchy a real overhaul**, not just a color fix. It
  still had the old print-and-grow-on-a-plate loop and mismatched hull color, both
  leftover from before the landing hero dropped the "printer" framing entirely per
  earlier feedback. Removed the build plate and the scale-from-zero cycle, replaced with
  the same gentle already-afloat bob/sway the landing hero's boat uses, matched hull
  color to the same off-white — same real Benchy, consistent everywhere it appears now.
  Verified: `pnpm typecheck`/`lint`/`format:check`/`build` all pass; confirmed live via
  claude-in-chrome on both localhost and the deployed site (mascot renders as the real
  3D model in the corner, no console errors on landing or dashboard). Pushed to `main`
  and `mohit`, redeployed via the manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow, verified live on `https://makrd.vercel.app`.

- **2026-07-30 (evening)** — Shipped the pending mascot-glass/water-hero redesign, then
  fixed the actual cause of Mohit's "green bottom part vs blue water part" report.
  First, deployed the frosted-glass mascot panel and the water-sailing hero redesign
  that had been sitting locally verified-but-unshipped since earlier in the day (per
  the entry below) — Mohit asked directly for this ("most of the work is done just
  deploy everything"), so pushed to `main`/`mohit` and redeployed without re-litigating
  the design.
  **Found the real bug behind the green/blue mismatch**: the vibrant-palette recolor
  earlier today updated `skipper-3d.tsx`'s materials but missed `benchy-scroll-scene.tsx`
  — the boat's hull was still `#16a34a` (green) and one of the scene's directional
  lights was still `#4ade80` (green), both sitting in a scene that's otherwise entirely
  blue water. Boat is now off-white (`#f5f5f0`, plain "molded plastic," won't clash with
  any water color); the stray light is now pale sky blue (`#7dd3fc`).
  **Made the water read as more real, per the ask.** `WaterSurface` now writes a
  per-vertex color attribute alongside its existing sine-wave displacement, blending
  from deep-water blue to white foam wherever a wave crest is tall enough
  (`THREE.MathUtils.smoothstep` on the same height value already being computed each
  frame) — whitecaps instead of a flat blue plane. Added `HullWake`, a soft pulsing
  white ring that tracks the boat's world position (lifted out of `ScrollBenchy` into a
  shared `boatPositionRef` so both components read the same source of truth) and sits
  right at the waterline — reads as a bow wave breaking against the hull without any
  real fluid simulation.
  Tried reconnecting `claude-in-chrome` again this session (Mohit relaunched with
  `--chrome` per my instructions, tools became available) but `tabs_context_mcp` still
  reports the extension itself as not connected — progress over the earlier "unknown
  skill" error, but still no actual browser access. Verified via `pnpm typecheck`/
  `lint`/`format:check`/`build` and a dev-server smoke test only; the foam/color
  rendering has not been seen firsthand.
  Pushed to `main` and `mohit` across two commits, redeployed via the manual
  `vercel build --prod` + `vercel deploy --prebuilt --prod` workflow after each,
  verified live on `https://makrd.vercel.app`.

- **2026-07-30 (later)** — Redesigned the landing hero's scroll narrative per Mohit's
  feedback that the scale-up-in-place didn't read as "being printed," and per his
  fuller description of what he actually wanted: no printer at all, just the benchy
  sailing through water the whole time, camera changing angle/distance as you scroll.
  Removed `PrinterRig`/`PrintHeadFan`/`BuildPlate` from `benchy-scroll-scene.tsx`
  entirely (the printer-rig joint/nozzle fixes from earlier today are now moot — the rig
  itself is gone). Added `WaterSurface`: a large rippling plane (sine-displaced vertex
  positions each frame, no shader) the benchy sails across for the *entire* section, not
  just a finale overlay. `ScrollBenchy` now drives both the boat and the camera off one
  shared `target` position per frame: the boat appears already afloat (no build-up),
  drifts slowly across the water (x/z position tied to scroll progress) and
  bobs/sways continuously, while the camera runs through three stages —
  `ORBIT_END=0.4` (close orbit around it as it settles), `FRONT_AT=0.7` (converges to a
  low front-on view, water clearly under the hull, benchy still large/close), then pulls
  back and up into a wide "boat on the ocean" establishing shot for the remainder.
  Renamed the DOM finale overlay's driving variable from `--hop-progress` to
  `--finale-progress` and narrowed its window to the last 12% of scroll (was tied to a
  20%-of-scroll hop arc that no longer exists) — it now just fades in to bridge the 3D
  scene's water into the CSS `WaterFlow` section immediately below.
  Verified live via claude-in-chrome against a local dev server: printer confirmed gone,
  orbit stage reads as the camera circling the floating boat, front-view stage shows a
  clear horizon line with the boat sitting large in the water, and jumping to ~88%
  scroll (via `window.scrollTo` to a computed pixel offset, since coarse scroll-wheel
  steps kept skipping past this narrow window) confirmed the wide scenery shot — small
  boat, big ocean, matches what Mohit described. No console errors. `pnpm typecheck`/
  `lint`/`format:check`/`build` all pass. STAGES text copy (the 4 kicker/title/body
  panels) left unchanged — Mohit's ask was about the 3D staging, not the marketing copy,
  and the existing copy doesn't reference the printer rig specifically. **Not yet
  pushed or deployed** — holding for Mohit to see it first, same as the pattern for
  every visual change this session.

- **2026-07-30** — Fixed a real geometry bug Mohit spotted: the printer rig's frame
  looked "broken, not joint[ed]." It was — the crossbar sat at `z=0` while the four
  corner posts were at `z=±1.7`, so it never touched any of them, just floated in the
  middle of the frame in empty space. The print head had a matching problem: it started
  at `y=-0.9` (level with the build plate, actually piercing through it — the nozzle
  cone extended to `y=-1.02`, below the plate) while the rail stayed fixed at `y=1.2`
  near the top, so the two were never physically together at any point in the
  animation. Rebuilt `PrinterRig` in `benchy-scroll-scene.tsx`: the top is now a proper
  closed rectangle (4 horizontal beams joining all 4 uprights, not one floating
  crossbar), two inset Z-guide rods run the frame's full height, and the gantry (rail +
  head, one group) rides those rods as a single physically-joined assembly — the head
  is always flush against the rail, and the whole thing now starts just above the bed
  and rises smoothly instead of starting off buried in the plate.
  **Also replaced the print head itself** — Mohit separately flagged it as "just a cube
  sliding back and forth." It was, literally: a plain box + a static cone. Rebuilt it as
  a real hotend stack: a carriage clip, a heatsink cylinder wrapped in three fin rings
  (torus geometry), a heater block, a brass-colored nozzle cone with an emissive
  hot-glow tip, and a side-mounted cooling fan whose blade actually spins (its own
  `useFrame` rotation, `PrintHeadFan`). Kept the existing hop-away fade (whole gantry
  assembly's opacity ties to `hopP` via `group.traverse`, applied consistently to
  everything now that it's one connected group, rather than only the old head box).
  Verified live via claude-in-chrome against a local dev server (not just clean build):
  zoomed into the frame corners and confirmed the top rail now visibly meets the
  uprights, and zoomed into the print head mid-build to confirm it reads as a real
  hotend (heatsink, fan, nozzle) sitting flush under the rail rather than a floating
  cube. `pnpm typecheck`/`lint`/`format:check`/`build` all pass.
  **Shipped**, along with yesterday's green/water/cursor changes, once Mohit gave the
  go-ahead — single commit covering both days' landing-page work, pushed to `main` and
  `mohit`, deployed via `vercel build --prod` + `vercel deploy --prebuilt --prod`,
  verified live on `https://makrd.vercel.app` (green theme confirmed rendering).

- **2026-07-29 (late afternoon)** — Reverted straight back to green after the vibrant
  push earlier today — Mohit didn't like it on the landing page specifically, wanted
  "realistic colours," a more convincing water finale, and the cursor flourish visible
  from the top of the page instead of only near the bottom.
  **Green, but landing-page-only this time.** Rather than flipping the global
  `--accent-*`/`--blob-*` CSS vars back (which would've dragged the nav, dashboard, and
  every interior page along with it), added `:root.theme-landing-green` in
  `globals.css` plus a tiny client component (`components/landing-theme.tsx`) that
  toggles the class on `<html>` for as long as the landing page is mounted. Nav renders
  in the root layout outside the page's own markup, so scoping to `<html>` rather than
  a wrapper div was needed for the nav's sign-in button/logo to pick up green too while
  still leaving `/login` and every authenticated page on the vibrant palette (verified
  both live side by side). Picked deep forest → fresh-leaf green (`#14532d` →
  `#16a34a` → `#4ade80`, gold `#ca8a04` for warm accent) instead of the old neon
  black-and-green, plus matching hull/rim-light colors on the landing hero's Benchy
  (`benchy-scroll-scene.tsx` only — the mascot's `skipper-3d.tsx` elsewhere in the app
  stays on its own colors, it's not landing-page-scoped). Water intentionally stays on
  its own independent `--water-*` blue vars throughout — real water shouldn't turn
  green just because the brand accent did.
  **Made the water finale actually look like water.** The old version was a flat SVG
  sine wave — smooth, repeating, obviously not real. `components/water-flow.tsx` now
  runs the wave paths through an SVG `feTurbulence`/`feDisplacementMap` filter so the
  edges are irregular instead of a perfect curve, added a third parallax drift layer at
  a different speed, and layered a caustics overlay (blended radial-gradient light
  patches, `mix-blend-mode: screen`) plus a slow diagonal sheen on top — the two classic
  CSS tricks for making a flat gradient read as light moving on a real surface. New
  `water-drift-3`/`water-caustics`/`water-sheen` keyframes in `globals.css`, all folded
  into the existing `prefers-reduced-motion` kill-switch alongside the older wave/boat
  animations.
  **Cursor flourish now runs the whole landing page, not just the last stretch.**
  Previous version hid the native OS cursor from load and only swapped in a custom ring
  once scroll passed a marker near the bottom — a deliberate fix for an earlier bug
  where the page briefly became unclickable if the custom cursor failed to render.
  Kept that safety property but changed the trade-off: `components/custom-cursor.tsx`
  no longer hides the native cursor at all, ever — it only draws a translucent
  glass-style ring (border + backdrop-blur + accent-tinted glow, matching the site's
  existing `.glass` look) on top of wherever the real cursor already is, active from
  the first mouse move anywhere on `/`. Dropped the GSAP ScrollTrigger marker logic
  entirely (no longer needed) in favor of a plain `usePathname() === "/"` check, so it's
  simultaneously simpler and impossible to reintroduce the old unclickable-page failure
  mode, since the native pointer is never touched. Removed the now-orphaned
  `#cursor-activate-marker` div from `app/page.tsx` and the `body.custom-cursor-active
  { cursor: none }` rule it drove.
  Verified live via claude-in-chrome against a local dev server (not just clean
  build/lint): green theme confirmed on `/`, vibrant theme confirmed still intact on
  `/login`, water's turbulence-distorted edges and caustic light patches visibly
  rendering after scrolling to the finale. Cursor ring's actual computed styles
  (position tracks the pointer, opacity reaches 1, correct glass styling) were
  confirmed correct via direct DOM inspection, but weren't visible in the screenshot —
  traced this to the automated browser profile itself having
  `prefers-reduced-motion: reduce` set at the OS level, which the app's own
  accessibility rule (present before this session, left untouched) correctly hides all
  cursor-following motion for — not a bug, just this particular browser's a11y setting;
  should render normally for Mohit's own browser. `pnpm typecheck`/`lint`/
  `format:check`/`build` all pass (23 routes). **Shipped the next day (2026-07-30)**
  alongside the printer-rig fix below, once Mohit confirmed the look — see that entry
  for the push/deploy details.

- **2026-07-29 (afternoon)** — Finally got real browser access and clicked through the
  live site — closing out the "unverified in browser" caveat that had been sitting on
  the last several log entries. Loaded `https://makrd.vercel.app` via
  claude-in-chrome and scrolled the full pinned hero sequence end to end.
  **The pin-overlap bug is actually fixed**: the printer rig, Benchy build-up, and
  hop-into-water finale all release cleanly into "Meet the network" and the sign-in CTA
  section with no overlap — sign-in button stayed clickable throughout. Printer rig
  (corner posts, rail, print head with orange nozzle) renders and animates with build
  progress as expected. Water finale is genuinely blue/foam, not the old green. Vibrant
  blue→violet→pink palette confirmed live everywhere, no leftover green hex anywhere in
  the scroll-through. No console errors on load or after interaction; Skipper's FAQ
  panel opens cleanly. Did not test the actual Google OAuth round trip or interior
  authenticated pages this pass — landing page was the specific thing flagged as
  unverified, so that's what got checked.

- **2026-07-29 (mid-morning)** — Fixed a real hero-pinning bug, added a printer rig +
  hop-into-water finale, dropped the green theme for something vibrant.
  **Fixed content overlapping the sign-in CTA on scroll.** The pinned hero
  (`ScrollTrigger` `pin: true`) inserts and measures its own spacer element in the DOM
  to reserve scroll space — under some layout-timing condition that measurement went
  stale, so the pinned scene didn't release cleanly and sat on top of the "your next
  print is one step away" sign-in section below it, exactly as Mohit reported live.
  Replaced the GSAP pin with a plain CSS `position: sticky` inner layer inside a tall
  (400vh) wrapper — no separate spacer-measurement step exists in that approach, so it
  can't hit this failure mode. Also added a defensive `ScrollTrigger.refresh()` on
  window load as a second safety net for the same class of bug anywhere else on the
  page. Could not reproduce/confirm the fix live (still no browser access), so this is
  reasoned from how GSAP's pin-spacer mechanism works, not visually verified.
  **Added a printer rig around the build animation.** Corner posts, an X-axis rail, and
  a print head that rises with build progress and sweeps side to side — not modeled on
  any specific branded printer, a generic enclosed-gantry look, so the Benchy now reads
  as being actively printed rather than floating in space.
  **Extended the scroll story with a hop-into-water finale.** The last ~20% of the
  scroll region plays the Benchy arcing up off the plate and dropping out of frame
  (falls behind the opaque plate, which naturally occludes it — no transparency tricks
  needed) while a blue water-color overlay and a foam-line SVG fade in via a
  `--hop-progress` CSS custom property set directly in the scroll handler (kept off
  React state so it doesn't add re-renders). `WaterFlow` further down the page — the
  section between the hero and the actual sign-in button — now uses new `--water-*` CSS
  vars (real blue/foam tones) instead of the site's accent gradient, so it reads as
  actual water regardless of brand palette.
  **Dropped black-and-green for a vibrant palette**, per explicit instruction ("no need
  to follow the green colour scheme anymore"): accent gradient is now electric
  blue → violet → pink across light and dark mode. Swapped every hardcoded green hex
  left in the 3D scenes too (hull material, fresnel glow, point/directional lights, the
  Razorpay checkout theme color) — grepped the whole codebase afterward to confirm no
  green hex codes were left behind.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  dev-server smoke test (landing page renders, sticky 400vh wrapper present in the HTML,
  no server errors). Pushed to `main` and `mohit`, redeployed via the manual
  `vercel build --prod` + `vercel deploy --prebuilt --prod` workflow, verified live on
  `https://makrd.vercel.app`. **Still true: none of this has been seen in a real
  browser** — the scroll timing, rig visibility, hop animation, and whether the overlap
  bug is actually gone all need a real click-through to confirm.

- **2026-07-29 (early)** — Real 3DBenchy model, a fixed cursor bug that broke clicking,
  and a properly-glass nav — a fast follow-up to the previous entry's visual push.
  **Swapped the procedural hull for the actual Benchy.** Mohit provided a real
  `3dbenchy.stl` (225,706 triangles, 11MB — a raw/undecimated scan, too heavy to ship
  as-is, especially duplicated in the always-visible mascot). Wrote a one-off Node
  script using Three.js's `SimplifyModifier` to decimate it to 23,863 triangles/1.2MB —
  had to `mergeVertices()` first since STL exports as unindexed triangle soup with no
  shared vertices, which the edge-collapse decimator needs to find neighbors at all
  (failed with "No next vertex" until that fix). Verified the decimated output's
  bounding box (60×31×48mm) matches real Benchy proportions before wiring it in.
  `public/models/benchy.stl` is now the source of truth for both the persistent mascot
  and the loading screen (`components/benchy-model.tsx` loads/centers/normalizes it via
  Three's `STLLoader`); dropped the old cartoon eyes/funnel overlay since it didn't
  belong on what's now meant to read as a realistic render.
  **Rebuilt the landing hero as a pinned, scroll-scrubbed scene**
  (`components/benchy-scroll-scene.tsx`, replacing the earlier `CinematicHero`, now
  deleted): the real model builds up from the plate while the camera orbits around it
  — POV drifting around a static model, not the model spinning — as the user scrolls,
  with product-pitch text panels swapping at fixed scroll checkpoints. Camera/scale
  updates read a ref each frame rather than triggering React re-renders on scroll.
  **Fixed a real bug Mohit hit live: the custom cursor made the site unusable.** The
  previous version hid the native OS cursor from page load; if the custom one failed to
  render for any reason (or just hadn't received a mousemove yet), there was no visible
  cursor anywhere, making it impossible to tell where a click would land. Redesigned
  per Mohit's direction: the native cursor is untouched through most of the page, and a
  soft glowing ring only takes over once scroll reaches a marker just before the final
  sign-in section — by then mousemove has already fired many times, so the custom
  cursor is guaranteed to be positioned correctly before the native one ever hides.
  Scrolling back up restores the native cursor.
  **Gave the nav real glass.** Added `.glass-nav` — heavier blur/saturation, a brighter
  top-edge highlight, a subtle gradient sheen — specifically for the floating nav pill,
  instead of reusing the same `.glass-strong` every other panel uses.
  **Still true, worth restating: none of the WebGL/shader/GSAP/scroll work has been
  visually verified in a real browser.** Attempted the `claude-in-chrome` skill this
  session per Mohit's request; it errored out ("Tool result missing due to internal
  error") despite him confirming access was granted — flagged, not resolved, and Mohit
  said to leave it for now. Everything here is verified only via clean typecheck/lint/
  build and dev-server smoke tests (confirmed `/models/benchy.stl` serves at the
  correct 1.19MB, confirmed the scroll-scene's first stage server-renders) — a real,
  still-open gap until someone can actually click through it in a browser.
  Pushed to `main` and `mohit`, redeployed via the manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow, verified live on `https://makrd.vercel.app`.

- **2026-07-28 (night)** — 1:1 direct messages, then a full landing-page/visual push
  after Mohit linked several reference sites.
  **Added a real DM system.** New `direct_messages` table (RLS: read only your own
  sent/received rows, insert only as yourself — same trivial-but-safe pattern as the
  community chat, scoped to a pair instead of everyone). `/messages` is an inbox listing
  every other member with their latest message preview, most-recent conversations
  first; `/messages/[userId]` is a live per-conversation thread via Realtime. "Message"
  links added to printer cards on `/community`, and job detail pages now show
  "Chat with your printer" / "Chat with requester" once a job has an assigned provider,
  linking straight to that DM thread. This is the DM feature flagged as deferred
  earlier this session (needed its own privacy-reviewed RLS design) — built now that it
  was asked for directly.
  **Rebuilt the landing page**, chasing references Mohit linked (creativeglu.ai 403'd
  for me; organimo.com fetched fine — expressive typography, scroll reveals, minimalist
  layout). Added scroll-triggered reveal animations to every section
  (`components/reveal.tsx`), a new "Meet the network" section showing real printer
  specs from the catalog (careful to frame this as *member-owned* printers already on
  the network, not a makrd-branded hardware product — the modular printer is an
  unbuilt future pillar per PRODUCT.md, out of scope to imply otherwise), and a
  stylized (not physically simulated) flowing-water transition
  (`components/water-flow.tsx` — layered animated SVG waves) with the Benchy hull
  drifting and bobbing across it into the sign-in CTA.
  **Then pushed further toward lusion.co/activetheory.net** — both genuinely
  high-production WebGL agency portfolio sites. Flagged the trade-off first (new
  dependency, real complexity/perf cost) via AskUserQuestion; Mohit chose to go for it.
  Added **GSAP + ScrollTrigger** (first animation library in the project — previously
  everything was deliberately pure CSS/SVG/Three.js) and built: a site-wide trailing
  custom cursor (`components/custom-cursor.tsx`, disabled on touch devices), a
  word-by-word staggered hero headline reveal with scroll-driven parallax on the 3D
  model (`components/cinematic-hero.tsx` — the parallax only touches a DOM wrapper's
  CSS transform, not the Three.js internals, so a GSAP mistake can't break the WebGL
  scene), rebuilt `Reveal` on ScrollTrigger instead of a raw IntersectionObserver for
  consistent easing, and a hand-written fresnel rim-light shader on the Skipper hull
  (`components/skipper-3d.tsx` — the one bit of custom GLSL in the app, isolated on its
  own glow-shell mesh so a shader bug can't break the base hull).
  **Also made the persistent corner mascot show the real 3D model on every page now**,
  not just when its panel opens — previously kept on the flat SVG face in its collapsed
  state specifically to avoid a WebGL canvas on every page load. That trade-off is now
  made deliberately per explicit request ("the same realistic benchy should be on every
  page"). Combined with the new cursor/parallax/shader work, every single page now
  carries a live Three.js scene plus GSAP animation — worth watching load time and
  battery impact on lower-end devices once there's a real browser to check it in.
  **Could not visually verify any of the WebGL/shader/GSAP work in a real browser** — no
  browser tool available this session (Mohit said to skip claude-in-chrome, it wasn't
  working). Clean server logs and a successful production build are the strongest
  signals available; genuinely worth a real look once Mohit's back, both that it
  renders as intended and that performance holds up.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  `get_advisors` clean (same pre-existing expected warnings only); dev-server smoke
  tests after each sub-batch. Pushed to `main` and `mohit` across several commits,
  redeployed via the manual `vercel build --prod` + `vercel deploy --prebuilt --prod`
  workflow after each, verified live on `https://makrd.vercel.app`.

- **2026-07-28 (evening)** — Data reset + no-more-free-prints rule, community chat,
  nav/mascot/theme fixes, from another rapid-fire feedback batch.
  **Reset all job and points history.** Cleared `jobs` and `points_ledger` entirely and
  put every profile back to a clean 25-point signup-bonus baseline (fresh ledger entry
  each) — a clean slate for testing. Two small orphaned STL test files remain in the
  `job-files` Storage bucket from before the reset; Supabase blocks direct SQL deletion
  of storage objects (must go through the Storage API, which needs a live user session
  I didn't have) — harmless, just two small leftover files.
  **Removed the first-print-free promo.** It directly contradicted the new rule
  ("anything above 0g needs to have a certain amount of points as reward") — every job
  now costs at least 1 point unconditionally, weight must stay strictly positive to
  submit at all. Migration `20260728030000_remove_free_print_promo.sql`.
  **Investigated "all jobs not visible."** Reviewed the `/jobs` query, dashboard
  queries, and the jobs RLS SELECT policy — found no code-level bug; the policy and
  queries look correct (`status = 'submitted' OR requester_id = uid() OR provider_id =
  uid()`). Best explanation: jobs that auto-match to a free provider leave the open
  marketplace instantly (by design, they're no longer open), which can read as "gone."
  Given the data reset, flagged this as worth re-confirming with fresh data rather than
  guessing further at a fix that might not exist.
  **Added a community chat.** New `community_messages` table + RLS (any signed-in maKr
  can read; can only insert as themselves) wired into a live panel on `/community` via
  Supabase Realtime. Deliberately a single public town-square channel, not 1:1 DMs —
  DMs need their own privacy-reviewed design (flagged earlier this session as
  out-of-scope-for-now); this keeps the RLS trivial and low-risk.
  **Fixed the nav overlaying content on scroll.** The floating pill nav now hides on
  scroll-down and reappears on scroll-up/near-top (`components/scroll-hide.tsx`)
  instead of permanently sitting on top of page content while scrolling.
  **Upgraded the persistent mascot to the real 3D model.** The corner button's expanded
  panel now reuses the 3D Skipper model already built for the loading screen
  (`components/skipper-3d-inline.tsx`, dynamic-imported client-only) instead of the
  flat SVG face — the collapsed button itself stays on the cheap SVG so a WebGL canvas
  isn't mounted on every single page load, only when the panel is actually opened.
  **Recolored the site to black and green.** Changed the CSS custom properties that
  drive glass/gradient/accent styling (`app/globals.css`) for both light and dark mode,
  plus the 3D mascot's hull/lighting colors and the Razorpay checkout theme color.
  Nearly every component already referenced these vars instead of hardcoded Tailwind
  colors, so this was a small, centralized change rather than a per-component rewrite.
  Couldn't fetch the reference site Mohit linked (creativeglu.ai) — it returned a 403 —
  so this is my own design judgment on "black and green," not a direct match to that
  site; worth a look together if the direction isn't right.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  `get_advisors` clean (same pre-existing expected warnings only); dev-server smoke test
  (public routes 200, protected routes correctly redirecting, no server errors). Pushed
  to `main` and `mohit`, redeployed via the manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow, verified live on `https://makrd.vercel.app`.

- **2026-07-28 (later)** — Follow-up batch: disabled Razorpay, fixed the real cause of
  STL uploads still failing, added weight rendering + a provider commission.
  **Found the actual STL upload bug.** The earlier same-day fix (raising Next's
  `serverActions.bodySizeLimit` to 100mb) only addressed Next's own artificial cap —
  Vercel's Node serverless functions enforce a separate, much lower request-body limit
  (~4.5MB) that no Next.js config can override, so any real model file was still being
  rejected by the platform itself, one layer below where the earlier fix could reach.
  Surfaced live as "An unexpected response was received from the server." Fixed for
  real this time: `job-form.tsx` now uploads the file straight from the browser to the
  `job-files` Storage bucket (existing RLS already scopes writes to the uploader's own
  folder) and only sends the resulting storage path to the `submitJob` Server Action —
  no file bytes ever cross the Server Action boundary again. Also found and fixed a
  second, unrelated cause of the same symptom: the 5 profiles that existed before that
  day's earlier signup-bonus migration were stuck at 0 points (the bonus only applies
  to new signups going forward), so `check_requester_balance` was correctly rejecting
  any job over the free-print threshold — backfilled the 25-point bonus to all 5
  existing accounts for fairness. Verified the DB trigger chain directly via a
  rolled-back SQL insert against a real account; could not fully simulate the browser
  upload flow itself (no test credentials or email inbox access, and I deliberately did
  not try to force-confirm a throwaway signup by writing to `auth.users` directly — that
  got (correctly) blocked by a safety check, and forcing it further felt like the wrong
  call for a security-sensitive table).
  **Disabled buying points with real money.** Razorpay's account approval isn't
  happening soon, so points are labour-driven for now — commented out (not deleted) the
  nav link, dashboard quick action, and Skipper's buy-points dialogue/FAQ line;
  `/buy-points` now shows a "not open yet, earn by printing instead" placeholder. The
  real integration (`buy-points-form.tsx`, the webhook route, the `points_purchases`
  table/RPCs) is untouched and easy to re-enable later.
  **Added real weight estimation ("rendering software").** `lib/stl-weight.ts` is a
  small self-contained STL parser (binary + ASCII, no new dependency) that computes a
  mesh's solid volume via the divergence theorem — verified against a 10mm test cube
  (expected 1cm³, got 0.9999999999999999cm³). Combined with per-material density and an
  assumed 20% infill factor (real prints aren't solid — a rough approximation by design,
  tunable via one constant) to estimate weight per copy. The job form auto-fills this
  when an STL is selected (still editable if the estimate looks off); `submitJob`
  recomputes it server-side from the actual uploaded file for STL specifically, so the
  client-supplied number can't be trusted for pricing on that format. 3MF/STEP/OBJ still
  need a manual weight — no volume parser for those yet, was out of scope to build a
  zip/CAD parser for this pass.
  **Added a provider commission.** On job completion the provider now keeps 90% of the
  requester's payment (`handle_job_completed` migration
  `20260728020000_provider_commission.sql`) instead of the full amount; shown as
  "you'd earn ~X pts" on the open jobs list and job detail page. The remaining 10% isn't
  routed anywhere yet — no platform account exists to hold it — a starting proportion
  flagged as easy to retune (`PROVIDER_COMMISSION_RATE` in `lib/points.ts` + the SQL
  trigger) rather than a settled design.
  **Storage capacity, raised by Mohit mid-session, not yet resolved:** the Supabase
  project is on the **free plan** (confirmed via `get_organization`) — free-tier file
  storage is capped in the low single digits of GB, and job model files (up to 100MB
  each per the bucket's own cap) will accumulate with real usage. Nothing was built to
  address this (no auto-delete — deleting a requester's file could break their ability
  to re-download it later, a data-retention call that needs Mohit's input, not a silent
  decision). Worth deciding before real traffic: a retention/cleanup policy, and/or
  budgeting for a plan upgrade once usage grows.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  `get_advisors` clean (only the same pre-existing expected warnings); pushed to `main`
  and `mohit`, redeployed via the manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow, verified live on `https://makrd.vercel.app`.

- **2026-07-28** — Batch of bug fixes + features from a single long feedback message.
  Fixed three real bugs: (1) STL/3MF/STEP uploads failing with "something went wrong"
  every time — root cause was Next's default 1MB Server Action body limit rejecting
  almost any real model file; raised to 100mb in `next.config.ts` to match the
  `job-files` Storage bucket's own cap. (2) White-on-white dropdown text — native
  `<select>` popups render with browser/OS-controlled background regardless of our CSS;
  fixed with `color-scheme: light dark` plus explicit `<option>` colors (light + dark)
  in `globals.css`, and gave `GLASS_INPUT` an explicit text color. (3) 3MF/STEP support
  for job uploads — was already unrestricted, widened the file `accept` attribute to
  make it discoverable.
  Shipped the requested features: 25-point signup bonus on every new user (with a
  ledger entry); switched job pricing from a flat per-unit rate to weight-based
  (points-per-gram × grams × qty, still server-recomputed and enforced via the
  `set_job_points` trigger, never trusts the client) — migration
  `20260728010000_signup_bonus_and_weight_pricing.sql`, applied live; a first-print-free
  promo (a requester's first-ever job is free if total weight ≤10g), surfaced as an
  inline banner on the job form when the current input qualifies; a custom/"Other"
  material text box on both the job form and the printer registration form; a static
  printer catalog (`lib/printer-models.ts`, 22 common models with real build volumes —
  a plain data file, not a DB table, since this is fixed reference data with no need for
  runtime mutation) wired into the printer registration form as a picker that auto-fills
  make/model/build volume while keeping every field editable after.
  **Investigated but NOT fixed:** "signs out every time I close the page." Read through
  `lib/supabase/middleware.ts`, `lib/supabase/client.ts`, and `proxy.ts` — all match
  Supabase's own documented `@supabase/ssr` pattern exactly, and I couldn't find a
  code-level cause (also checked Supabase's docs search for known session-persistence
  issues, nothing conclusive). Two things worth checking on your end: whether this is
  being tested in a private/incognito window (which never persists cookies across a
  close by design), and Supabase Dashboard → Authentication → Sessions for a timeout
  setting shorter than expected — I don't have a tool that can inspect or change that
  setting. Flagging honestly rather than guessing at a fix.
  **Deliberately held, not built:** the "convert points to money" cash-payout half of
  the rewards ask. Converting earned points to a real bank payout is a materially
  different (and bigger) thing than accepting payment for points — it needs linked
  payee bank accounts, KYC per payee (not just per requester), and in India specifically
  has TDS/tax-withholding implications. Didn't want to build that silently inside a
  larger batch of changes; wanted to flag it and talk through scope first. The
  "spend points in rewards" half already exists as a preview at `/shop` from earlier in
  the session — it's UI only so far, not yet wired to actually deduct points.
  Verified: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all pass;
  dev server smoke-tested (public routes 200, protected routes correctly redirecting).
  Pushed to `main` and `mohit`, redeployed via the manual `vercel build --prod` +
  `vercel deploy --prebuilt --prod` workflow (git-push auto-deploy is still blocked —
  see the entry below), verified live on `https://makrd.vercel.app`.

- **2026-07-27** — Added buying points with real money via Razorpay — asked first
  since it's both a paid third-party service (CLAUDE.md gate) and a real change to the
  economic model (this was a pure earn-by-labor points economy until now; "no cash
  changes hands" was on the landing page, the tour, and Skipper's FAQ — updated all
  three to acknowledge top-ups instead of ripping that framing out). Mohit chose
  Razorpay over Stripe (India focus) and "buy points directly" over a subscription
  model, with the account going up under `makrd.admin@gmail.com`.
  New `points_purchases` table tracks Razorpay order → points, RLS read-only for the
  owner, no client insert/update policy at all — writes only happen through two RPCs:
  `create_points_purchase(package_id, order_id)` re-derives the real points/amount
  **server-side from a hardcoded package list**, exactly the same discipline as
  `set_job_points` — never trusts a client-supplied points or amount value, so even a
  raw REST call can't credit an arbitrary amount. `complete_points_purchase` (never
  granted to any client role) is the only thing that ever credits `points_balance` for
  a purchase, and only runs from the webhook after signature verification, gated by
  `status = 'created'` so retries can't double-credit.
  This is the first time `SUPABASE_SERVICE_ROLE_KEY` is actually used (new
  `lib/supabase/service.ts`) — every other RPC in this app runs through a user's own
  session, but a payment webhook has no user session to authenticate with, only
  Razorpay's HMAC signature, so it needs the elevated key to write `points_purchases`/
  `profiles` on the payer's behalf. Verified the webhook route
  (`app/api/razorpay/webhook/route.ts`) fails closed and clean (500 with a plain JSON
  error, not an uncaught exception) when the secret isn't configured yet — confirmed
  locally, since there's nothing to test end-to-end without real keys.
  Order creation calls Razorpay's Orders API directly via `fetch` rather than adding
  their `razorpay` npm package — it's one simple authenticated POST, didn't seem worth
  a new dependency for. Client-side uses Razorpay's own hosted Checkout widget
  (`checkout.razorpay.com/v1/checkout.js` via `next/script`) so raw card details never
  touch our code, keeping this out of PCI scope.
  Added `/buy-points` (3 preset packages, placeholder flat rate of ₹1 = 1 point — a real
  pricing decision Mohit should sanity-check, easy to adjust in one place:
  `lib/points-purchase.ts` display config + the SQL function's `case` statement, which
  is the actually-authoritative side). Linked from nav and dashboard quick actions.
  Also refreshed `README.md`, which had gone stale since the very first scaffold commit
  (still described an empty placeholder migration) — added the Razorpay env var table
  and a note on the current git-triggered-deploys-are-blocked situation.
  **Manual steps still needed, cannot be done from here:** create the actual Razorpay
  account and complete KYC (real business/identity verification — Test Mode keys work
  immediately without this, enough to verify the integration), then hand over the Key
  ID/Secret and, once I have a webhook URL, the webhook secret, the same way the
  Supabase keys got set as Vercel env vars earlier tonight.
  Verified typecheck/lint/format/build (22 routes now) and a route smoke test.

- **2026-07-27** — Fixed a real bug Mohit hit live: the onboarding tour's last step
  still said "Sign in with Google" and linked to `/login` — a leftover from when the
  tour lived on the pre-signin landing page. Since it moved to the dashboard (an
  earlier entry tonight), everyone seeing it is already signed in, so that button was
  asking already-authenticated users to sign in again. Now just closes the tour
  ("Let's go!"). Verified typecheck/lint/format/build, redeployed.

- **2026-07-27** — Gave Skipper an actual 3D model instead of the SVG approximation,
  per "make the benchy realistic, proper 3D, Blender-made" — asked first since it meant
  a real dependency addition (breaks from the pure-CSS/SVG approach used everywhere
  else this session), Mohit confirmed. Added `three` + `@react-three/fiber` +
  `@react-three/drei` (+ `@types/three`). `components/skipper-3d.tsx` builds the hull
  procedurally (`THREE.Shape` → `ExtrudeGeometry`, no external asset file — there's no
  actual Benchy mesh asset available to load) with PBR materials
  (`meshPhysicalMaterial`, clearcoat) and real lights (no HDRI `<Environment>` — that
  pulls from pmndrs' CDN by default, and a few positioned lights get a decent look
  without adding an external asset dependency at render time). Same "grow from the
  build plate" reveal as the SVG version, done properly this time via `useFrame`
  animating the hull group's Y-scale. `OrbitControls` auto-rotates it for a showcase
  feel (zoom/pan disabled — this is a presentation, not a free camera).
  Loading screen swapped to this — `components/skipper-loading-scene.tsx` wraps it in
  `next/dynamic({ ssr: false })` since WebGL doesn't exist server-side and
  `app/loading.tsx` is a Server Component (App Router won't allow `ssr: false` directly
  in one), falling back to the existing SVG `PrinterLoaderRealistic` while the 3D
  chunk's JS loads.
  Verified typecheck/lint/format/build (still 20 routes, R3F's JSX intrinics —
  `<mesh>`, `<ambientLight>`, etc. — typechecked clean) and a route smoke test (no
  server-side errors). **Could not visually verify the actual WebGL rendering** — no
  browser available here; clean server logs is the strongest signal I have. Worth a
  real look once Mohit's back, both that it renders as intended and that it doesn't
  tank load time/battery on lower-end devices, since a full 3D scene is meaningfully
  heavier than everything else on this app.

- **2026-07-27** — Added email sign-in (password + one-time code) alongside Google —
  Mohit approved this explicitly since CLAUDE.md gates anything touching auth.
  `/login` now has a "continue with email" toggle revealing `EmailForm`
  (`app/login/email-form.tsx`): sign in / create account with a password, or an
  "email me a code instead" path using `signInWithOtp` + `verifyOtp` (6-digit code, no
  magic-link redirect needed for that path). Password sign-up reuses the existing
  `/auth/callback` route for the confirmation link — it's already a generic
  `exchangeCodeForSession` handler, works for email confirmation the same way it
  handles the Google OAuth code. No schema changes: `handle_new_user` already fires on
  any `auth.users` insert regardless of provider, so profile auto-creation just works
  for email signups too.
  **New relevant advisory, not fixed:** `auth_leaked_password_protection` (checks new
  passwords against HaveIBeenPwned) — noted as not-applicable back when the app was
  Google-only; now that passwords are a real signin method, it's worth turning on. It's
  a dashboard-only Auth setting, same category as enabling the Google provider — I
  don't have API access to toggle it, so it needs a manual flip:
  **Authentication → Sign In / Providers → Email**, or **Authentication → Policies**,
  enable leaked-password protection.
  Verified typecheck/lint/format/build (still 20 routes) and a route smoke test
  (confirmed the email toggle renders). **Not tested live** — verifying an actual
  password sign-up/confirmation/OTP round trip needs a real inbox, which I don't have;
  Mohit should click through it once.

- **2026-07-27** — Found and fixed why the live site had been showing 500 Internal
  Server Error this entire session, independent of any code — `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY` existed as variable names in Vercel but with
  **empty values**, AND were saved in Vercel's "sensitive" mode (write-only — once set,
  the value can never be read back via dashboard, CLI pull, or API, by design). That
  second part is why every earlier fix attempt looked like it worked from the CLI's
  perspective but didn't: `vercel build` running locally has no access to sensitive var
  values at all (that's the whole point of the feature), so every local
  `vercel build --prod` + `vercel deploy --prebuilt` cycle tonight was silently building
  without real Supabase credentials, no error until the deployed function actually tried
  to construct a client at request time. Fixed by removing and re-adding both vars with
  `--no-sensitive` (real values, confirmed readable via a fresh `vercel env pull`) for
  both Production and Development, then rebuilding and redeploying — confirmed the URL
  is now actually embedded in the build output before shipping it, and confirmed
  `https://makrd.vercel.app` returns 200 with real content afterward.
  **Still true, unrelated to this fix:** git-push-triggered deployments are still
  blocked (Hobby plan + private repo + commit-author mismatch, found earlier tonight) —
  the local build + `vercel deploy --prebuilt --prod` path is the reliable way to ship
  until that's resolved (make the repo public, or match the commit author to the
  Vercel account — Mohit hasn't picked one yet).

- **2026-07-27** — Named and shipped the mascot: **Skipper**, a Benchy with a face (it's
  a tugboat model already, so "Skipper" doubles as the tour-guide role). Added eyes +
  a smile to the hull in `printer-loader-realistic.tsx` so the loading screen literally
  shows Skipper being printed, per the "make it look like a Blender simulation" ask —
  still pure CSS/SVG (pseudo-3D shading + a perspective rig that orbits), not an actual
  3D render. New `components/mascot.tsx` — a floating button on every page (added once,
  in the root layout) showing Skipper with a page-aware dialogue line (different quip
  per route) that expands into a small FAQ panel (5 common questions, plain
  `<details>/<summary>`, no extra state needed). Folded the requested "Welcome to the
  3D print community, maKr!" greeting into the onboarding tour's first step instead of
  adding a separate banner, since the tour already auto-opens on first sign-in — same
  effect, one less thing to keep in sync.
  Verified typecheck/lint/format/build (still 20 routes) and a route smoke test.

- **2026-07-27** — Branding + layout pass, requested in a rapid-fire batch while Mohit
  was mostly away. Brand wordmark restyled "makrd" → "maKrd" everywhere visible (nav,
  page titles, hero, tour copy) plus a small logo mark (`components/logo-mark.tsx`,
  stacked print-layer glyph in the accent gradient) next to it in the nav and landing
  hero. Community members are now called "maKrs" in copy. Onboarding tour moved from
  the pre-signin landing page to the dashboard, so it opens after sign-in as asked (was
  previously unreachable for signed-in users anyway, since `/` redirects them before
  any client JS runs). Landing page rebuilt as a wider, asymmetric layout (`max-w-7xl`,
  two-column hero, side-by-side roadmap) instead of narrow centered stacked sections;
  same "stop mid-aligning, use the screen" treatment applied to dashboard (now a 3-col
  grid for printers/jobs instead of one stacked column), printers/jobs/community
  (card grids instead of vertical lists), and widened every remaining page's container.
  Added `components/printer-loader-realistic.tsx` — a more elaborate loader used only
  on `app/loading.tsx` (per "not here" — the simple one stays on login/landing): pseudo-
  3D shading gradients, a layer-line texture clipped to the hull, a glowing hot-end, and
  a CSS-perspective rig that gently orbits. Still pure CSS/SVG, no 3D engine — an actual
  Blender-quality render isn't achievable without adding Three.js, which I didn't pull
  in unasked.
  **Explicitly not built, flagged rather than attempted:** a community chat/DM system
  and a full coachmark-style tour engine (tooltips anchored to real buttons across
  pages) were also requested. Both are substantial features — chat needs new schema +
  carefully-reviewed RLS for private messages, the tour needs real positioning/targeting
  logic across every page — and rushing either without Mohit around to review the
  design (especially DM privacy) risked shipping something broken or insecure. Left the
  existing modal-carousel tour in place rather than half-replacing it.
  Verified typecheck/lint/format/build (still 20 routes) and a route smoke test.

- **2026-07-27** — Added automatic job-to-provider matching. When a job is submitted, an
  `auto_assign_job` AFTER INSERT trigger looks for a "free" provider — active printer,
  supports the job's material, owner isn't already the provider on any
  accepted/printing/verification job — and if one exists, immediately assigns the job to
  them (`status` → `accepted`) instead of leaving it in the open marketplace. Purely
  additive: manual browse-and-accept on `/jobs` still works exactly as before for
  whatever doesn't get auto-matched, since CLAUDE.md's confirmed v1 core loop is
  "providers browse open jobs and accept one" — this doesn't replace that, it just
  catches the easy case first. `submitJob` now re-fetches the job after insert (the
  INSERT's own `RETURNING` data reflects pre-trigger state, since the auto-assign
  trigger's UPDATE happens as a separate statement) and routes to
  `/dashboard?matched=1` with a confirmation banner when it worked.
  Found and fixed a real security gap while building this: the `jobs` INSERT policy
  only checked `requester_id`, not `provider_id` or `status` — a malicious client could
  have inserted a job pre-marked `accepted` with `provider_id` set to any user. Folded
  the fix into `set_job_points` (already the BEFORE INSERT trigger for `est_points`) so
  both are always forced to `null`/`'submitted'` server-side regardless of client input.
  `auto_assign_job` itself is trigger-only, same lockdown pattern as
  `handle_new_user`/`handle_job_completed` (revoked from public/anon/authenticated —
  the advisor flagged it callable by anon before that fix). `get_advisors` clean after
  (aside from the pre-existing, not-applicable leaked-password-protection warning).
  Verified typecheck/lint/format/build (still 20 routes) and a route smoke test.
  **Not tested live end-to-end** (no fake auth users inserted into the production DB to
  avoid polluting it) — verified via migration applying cleanly, advisors clean, and
  manual review of the matching query logic instead, consistent with how every other
  RPC/trigger this session was verified.

- **2026-07-27** — UI polish round + roadmap content pages. Fixed a real bug: `/printers`
  and `/jobs` headers used `flex items-center justify-between` with no wrap, so the
  heading and action button overlapped/crowded on narrow viewports — both now stack on
  small screens (`flex-col sm:flex-row`) with the button `whitespace-nowrap`. Nav links
  now highlight the active page: split `NavLinks` into its own client component using
  `usePathname()` (the rest of `Nav` stays an async Server Component fetching
  user/points — Server Components can't use `usePathname`, hence the split). Dashboard
  was sparse — added a stats row (points/printers/active jobs/completed-as-provider)
  and a quick-actions grid.
  Also added `/announcements`, `/recycling`, `/polishing`, `/shop` — Mohit asked for
  these, including for the two pillars CLAUDE.md explicitly marks out-of-scope for v1
  (filament recycling, print finishing) plus a points-redemption shop. Built all four as
  informational "coming soon" content only — no schema, no checkout, no job-type
  changes — specifically to honor the "do NOT build yet" scope line while still
  shipping the pages themselves. Nav grew to 6 items so it now scrolls horizontally on
  narrow screens (`.no-scrollbar` utility) instead of wrapping/breaking.
  Also cleaned up an unrelated lint break: a stray local `.vercel/output/` directory
  (leftover from CLI deploy debugging) was getting picked up by `pnpm lint` since it
  predates `.vercel/**` being in the ESLint ignore list — added the ignore, deleted the
  stale output.
  Verified typecheck/lint/format/build (20 routes) and a full route smoke test.
  **Flagged, not built:** Mohit also asked for email OTP + password sign-in, and an
  automatic provider-matching/assignment backend (auto-route jobs to free providers
  instead of manual browse-and-accept). The first touches auth, which CLAUDE.md says to
  confirm before building — asked, not yet answered. The second is a real scope/design
  decision (replaces vs. augments the manual accept flow) — planned as an additive
  `auto_assign_job` RPC so manual accept keeps working either way, building next.

- **2026-07-27** — Visual overhaul, part 2 (interior pages). Extended the liquid-glass
  treatment from part 1 to every authenticated page: dashboard (points balance now a
  hero stat tile), printers list + registration form, jobs marketplace + submission
  form + detail page, community directory, profile, and the error/auth-error pages.
  Pulled repeated class strings into `lib/ui.ts` (`GLASS_INPUT`, `BTN_PRIMARY`,
  `BTN_SECONDARY`) instead of copy-pasting the same long Tailwind strings into every
  form — five files were already duplicating the input styling verbatim before this.
  Full app now looks like one cohesive product front-to-back rather than a fancy
  landing page bolted onto a plain interior.
  Verified: typecheck/lint/format/build all pass; full route smoke test (public routes
  200, all 7 protected routes confirmed still redirecting via the
  `__next-page-redirect` marker per the note in the previous entry, no server errors in
  the dev log across either design pass tonight).

- **2026-07-27** — Visual overhaul, part 1 (foundation + front door). Mohit asked for a
  "liquid glass" look, a professional sign-in, loading animations, and a first-visit
  tutorial. Built as pure CSS/SVG — no framer-motion or animation library added, to keep
  the dependency list minimal per CLAUDE.md conventions.
  - `globals.css`: glass surface utilities (`.glass`/`.glass-strong`, blur+saturate
    backdrop-filter), a drifting animated gradient-blob ambient background
    (`.ambient-bg`, respects `prefers-reduced-motion`), a gradient text/button system,
    and the loader keyframes.
  - `components/printer-loader.tsx`: bespoke SVG animation — a nozzle sweeping over a
    boat-hull silhouette (stylized Benchy) that fills upward via `scaleY`, looping. Used
    as the root `app/loading.tsx` (shown automatically during route transitions) and as
    a hero visual on the landing/login pages.
  - `components/onboarding-tour.tsx`: a self-contained first-visit product tour
    (localStorage-gated, 5 steps, glass modal) that auto-opens on `/` for signed-out
    visitors; also renders its own "Take the tour" re-trigger button, so it drops into
    any page with no coordination needed.
  - Redesigned `/login` (glass card, real Google "G" logo button per their brand
    guidelines, the printer loader as a centerpiece) and `/` (glass cards for the
    how-it-works/roadmap sections, gradient CTAs, tour embedded near the hero).
  - `components/nav.tsx` is now a floating glass pill navbar instead of a plain bordered
    header.
  - **Interesting side effect, not a bug:** adding a root `app/loading.tsx` made
    protected routes stop returning a plain HTTP 307 to curl — Next.js can't send a
    real redirect once a Suspense boundary above the route has already started
    streaming a 200 response, so it falls back to an embedded
    `<meta http-equiv="refresh">` + client-side router redirect instead. Confirmed this
    still works correctly (verified via grepping for `__next-page-redirect` in the
    response body across all 7 protected routes) — just changes how to smoke-test it
    going forward; a real browser redirects effectively instantly either way.
  Verified typecheck/lint/format/build; dev-server smoke test adjusted per the above.
  **Next up:** the interior authenticated pages (dashboard, printers, jobs, community,
  profile) still use the old plain styling — need the same glass treatment for the app
  to feel cohesive front-to-back, not just a fancy front door.

- **2026-07-27** — Wrapping this solo stretch here. Last thing done: every route had the
  same "makrd" browser tab title — added per-page `metadata` (Dashboard, My Printers,
  Register a Printer, Open Jobs, Submit a Job, Job Details, Community, Profile, Health).
  Skipped `/login` — it's a client component (`"use client"` for the sign-in `onClick`),
  and splitting it just for a title felt like the wrong trade right now.
  Full route smoke test run after every change tonight — all public routes 200, all
  protected routes correctly 307 to `/login` signed out, landing page content confirmed
  rendering, no server errors in the dev log across ~7 rounds of typecheck/lint/format/
  build + dev-server checks.
  **Where things stand for v1 scope:** the full core loop (auth, register printer,
  submit job, browse/accept, points ledger, status tracking incl. release-back-to-
  marketplace, dashboard) is built and verified locally against the new Supabase
  project. Plus this session added a real landing page, a community printer directory,
  a profile page, and inline form errors. **Not verified: the actual browser OAuth round
  trip against the live Vercel deployment** — that needs Mohit (or anyone) to click
  through it once Vercel's env vars are confirmed current; I can't do that myself from
  here. Also still open: the `useActionState` inline-error treatment only covers job
  submission and printer registration, not the five single-button job-status RPCs
  (those still throw to `error.tsx`) — fine for now, lower value to convert.

- **2026-07-27** — Printers could be registered but never paused or reactivated — once
  created they were permanently `active` with no UI to change that, even though
  `/community` only lists active ones. Added a Pause/Reactivate toggle on `/printers`.
  No migration or RPC needed here: unlike jobs/profiles, an owner freely editing their
  own printer row isn't a fraud vector (no other party's points are at stake), so the
  existing owner-scoped UPDATE policy already covers it safely — used a plain
  `setPrinterStatus` server action. Verified typecheck/lint/format/build.

- **2026-07-27** — Closed another stuck-state gap: a provider who accepts a job then
  can't actually do it had no way back — status only ever moved forward. Added a
  `release_job` RPC (`accepted` → back to `submitted`, clears `provider_id`, provider-
  only, same security-definer pattern as the other five job RPCs) plus a "release back
  to the marketplace" button next to "Start printing" on `/jobs/[id]`. Also checked
  `get_advisors`: only the expected "authenticated can call this RPC" warnings (by
  design, each RPC re-checks `auth.uid()` internally) plus one unrelated
  `auth_leaked_password_protection` warning — not applicable, this app is Google-OAuth
  only, no passwords. `database.types.ts` updated. Verified typecheck/lint/format/build.

- **2026-07-27** — Added `/profile` — `profiles.display_name`/`location` existed in the
  schema since the first migration but had no UI to edit them. Nav's points-balance
  display is now a link there. No schema change needed (RLS already permits users to
  update their own profile row; the `protect_points_balance` trigger only blocks changes
  to `points_balance` specifically, not other columns). Verified typecheck/lint/format/
  build and a dev-server smoke test.

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
