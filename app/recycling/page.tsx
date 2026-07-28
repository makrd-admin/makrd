import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Filament Recycling · maKrd" };

export default async function RecyclingPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-4xl p-6 sm:p-10">
      <span className="glass mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        Coming soon — not live yet
      </span>
      <h1 className="mb-2 text-xl font-semibold">Filament recycling</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Every failed print and every spool of unused filament on the network is wasted material —
        and wasted money. Recycling closes that loop.
      </p>

      <div className="glass mb-4 rounded-2xl p-6">
        <h2 className="mb-1 font-semibold">How it&apos;ll work</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Members send in failed prints and filament waste, and earn points for doing it — the same
          way printing a job earns points today. That material gets reclaimed and reprocessed, with
          roughly 60% of it resold back into the community as cheap, ready-to-print filament.
        </p>
      </div>

      <div className="glass mb-4 rounded-2xl p-6">
        <h2 className="mb-1 font-semibold">Why it matters</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Material cost is one of the biggest levers on print price. Cheaper reclaimed filament
          means cheaper jobs for requesters and a lower barrier for new members to join as providers
          — the flywheel that makes the whole network cheaper as it grows.
        </p>
      </div>

      <Link href="/announcements" className="text-sm font-medium underline underline-offset-2">
        ← Back to announcements
      </Link>
    </main>
  );
}
