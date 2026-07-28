import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Announcements · maKrd" };

const ROADMAP = [
  {
    title: "Filament recycling",
    body: "Turning failed prints and waste back into cheap, reusable filament — roughly 60% reclaimed and resold into the community. This is the structural cost advantage: cheaper material means cheaper prints for everyone.",
    href: "/recycling",
    cta: "Read more",
  },
  {
    title: "Automated print finishing",
    body: "Resin-coating and polishing prints so network output can compete with professional-grade finishes, without every provider needing their own finishing setup.",
    href: "/polishing",
    cta: "Read more",
  },
  {
    title: "A fully-modular printer",
    body: "The moonshot: cheap, upgrade-don't-replace hardware, so members don't have to rebuy an entire machine for every upgrade — and businesses can tune a machine to their exact needs.",
    href: null,
    cta: null,
  },
];

export default async function AnnouncementsPage() {
  await requireUser();

  return (
    <main className="mx-auto w-full max-w-4xl p-6 sm:p-10">
      <h1 className="mb-2 text-xl font-semibold">Announcements</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        What&apos;s live today is the peer-to-peer marketplace — submit a job, register a printer,
        earn and spend points. Here&apos;s what&apos;s coming next.
      </p>

      <div className="flex flex-col gap-4">
        {ROADMAP.map((item) => (
          <div key={item.title} className="glass rounded-2xl p-6">
            <h2 className="mb-1 font-semibold">{item.title}</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.body}</p>
            {item.href && (
              <Link
                href={item.href}
                className="mt-3 inline-block text-sm font-medium underline underline-offset-2"
              >
                {item.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      <p className="glass mt-6 rounded-2xl p-6 text-sm text-neutral-500 dark:text-neutral-400">
        Why this order? Platform first — to validate demand and build the community — then recycling
        and finishing to deepen the moat and improve unit economics, then the modular printer,
        funded and de-risked by proven demand.
      </p>
    </main>
  );
}
