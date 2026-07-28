import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Rewards · makrd" };

const REWARDS = [
  { title: "1kg filament spool", cost: 150, body: "PLA, PETG, or ABS — your choice of color." },
  { title: "Nozzle set", cost: 60, body: "Brass nozzles in common sizes (0.2–0.8mm)." },
  { title: "Build plate sheet", cost: 220, body: "PEI or glass, sized for common bed dimensions." },
  {
    title: "Free filament recycling credit",
    cost: 40,
    body: "Skip the points cost on your next recycling drop-off.",
  },
];

export default async function ShopPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("points_balance")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <span className="glass mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        Coming soon — not live yet
      </span>
      <h1 className="mb-2 text-xl font-semibold">Rewards</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        Spend the points you&apos;ve earned printing for others on filament, printer accessories, or
        free recycling — instead of only ever spending them on jobs. You currently have{" "}
        <span className="text-gradient font-medium">{profile?.points_balance ?? 0} points</span>.
      </p>

      <ul className="flex flex-col gap-3">
        {REWARDS.map((reward) => (
          <li
            key={reward.title}
            className="glass flex items-center justify-between rounded-2xl p-5"
          >
            <div>
              <p className="font-medium">{reward.title}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{reward.body}</p>
            </div>
            <span className="rounded-full bg-black/5 px-3 py-1 text-sm whitespace-nowrap text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
              {reward.cost} pts
            </span>
          </li>
        ))}
      </ul>

      <p className="glass mt-6 rounded-2xl p-6 text-sm text-neutral-500 dark:text-neutral-400">
        Redemption and shipping aren&apos;t wired up yet — this is a preview of what spending points
        outside of jobs will look like.
      </p>

      <Link
        href="/announcements"
        className="mt-4 inline-block text-sm font-medium underline underline-offset-2"
      >
        ← Back to announcements
      </Link>
    </main>
  );
}
