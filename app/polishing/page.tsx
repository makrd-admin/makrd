import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Print Finishing · makrd" };

export default async function PolishingPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <span className="glass mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        Coming soon — not live yet
      </span>
      <h1 className="mb-2 text-xl font-semibold">Automated print finishing</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        A raw FDM print looks like a raw FDM print — visible layer lines and all. Finishing is what
        makes network output competitive with professional-grade parts.
      </p>

      <div className="glass mb-4 rounded-2xl p-6">
        <h2 className="mb-1 font-semibold">How it&apos;ll work</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Resin-coating and polishing as an add-on step on a job — spend a few extra points and your
          print comes back smooth, sealed, and ready to paint or display, instead of doing it
          yourself with sandpaper and primer.
        </p>
      </div>

      <div className="glass mb-4 rounded-2xl p-6">
        <h2 className="mb-1 font-semibold">Why it matters</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Not every provider owns finishing equipment, so this isn&apos;t left to chance per-job —
          it&apos;s a network-level service everyone can tap into, which pulls in higher-value
          demand that a raw-print-only marketplace can&apos;t serve.
        </p>
      </div>

      <Link href="/announcements" className="text-sm font-medium underline underline-offset-2">
        ← Back to announcements
      </Link>
    </main>
  );
}
