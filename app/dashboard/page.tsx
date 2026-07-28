import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import OnboardingTour from "@/components/onboarding-tour";

export const metadata: Metadata = { title: "Dashboard · maKrd" };

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  accepted: "Accepted",
  printing: "Printing",
  verification: "Verification",
  completed: "Completed",
  cancelled: "Cancelled",
};

const QUICK_ACTIONS = [
  { href: "/jobs/new", label: "Submit a job", hint: "Upload a model, get it printed" },
  { href: "/printers/new", label: "Register a printer", hint: "Start earning points" },
  { href: "/jobs", label: "Browse open jobs", hint: "Find work for your printer" },
  { href: "/community", label: "Community", hint: "See who's on the network" },
  { href: "/buy-points", label: "Buy points", hint: "Top up with a card or UPI" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ matched?: string }>;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { matched } = await searchParams;

  const [{ data: profile }, { data: printers }, { data: myJobs }, { data: jobsImPrinting }] =
    await Promise.all([
      supabase.from("profiles").select("points_balance").eq("id", user.id).single(),
      supabase
        .from("printers")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("jobs")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const completedAsProvider = (jobsImPrinting ?? []).filter((j) => j.status === "completed").length;
  const activeJobs = [...(myJobs ?? []), ...(jobsImPrinting ?? [])].filter((j) =>
    ["submitted", "accepted", "printing", "verification"].includes(j.status),
  ).length;

  const stats = [
    { label: "Points", value: profile?.points_balance ?? 0 },
    { label: "Printers", value: printers?.length ?? 0 },
    { label: "Active jobs", value: activeJobs },
    { label: "Jobs completed as provider", value: completedAsProvider },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 sm:p-10">
      {matched && (
        <p className="glass rounded-2xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Matched with a free provider automatically — your job&apos;s already accepted.
        </p>
      )}

      <section className="glass-strong rounded-3xl p-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Everything you own and everything you owe, in one place.
            </p>
          </div>
          <OnboardingTour />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <p className="text-gradient text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Quick actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="glass flex flex-col gap-1 rounded-2xl p-5 transition-transform hover:scale-[1.01]"
            >
              <span className="font-medium">{action.label}</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{action.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">My printers</h2>
            <Link href="/printers" className="text-sm text-neutral-500 hover:underline">
              View all
            </Link>
          </div>
          {!printers || printers.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No printers registered yet.{" "}
              <Link href="/printers/new" className="underline">
                Register one
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {printers.map((p) => (
                <li key={p.id} className="text-sm">
                  {p.make} {p.model}{" "}
                  <span className="text-neutral-400 dark:text-neutral-500">({p.model_id})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Jobs I&apos;ve submitted</h2>
            <Link href="/jobs/new" className="text-sm text-neutral-500 hover:underline">
              Submit
            </Link>
          </div>
          {!myJobs || myJobs.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No jobs submitted yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {myJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span>
                      {job.material} × {job.quantity} · {job.weight_grams}g · {job.est_points} pts
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Jobs I&apos;m printing</h2>
            <Link href="/jobs" className="text-sm text-neutral-500 hover:underline">
              Browse
            </Link>
          </div>
          {!jobsImPrinting || jobsImPrinting.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              You&apos;re not printing anything right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {jobsImPrinting.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span>
                      {job.material} × {job.quantity} · {job.weight_grams}g · {job.est_points} pts
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {STATUS_LABELS[job.status] ?? job.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
