import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  accepted: "Accepted",
  printing: "Printing",
  verification: "Verification",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

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

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 p-8">
      <section>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-neutral-500">Points balance: {profile?.points_balance ?? 0}</p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My printers</h2>
          <Link href="/printers" className="text-sm text-neutral-500 hover:underline">
            View all
          </Link>
        </div>
        {!printers || printers.length === 0 ? (
          <p className="text-sm text-neutral-500">
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
                {p.make} {p.model} <span className="text-neutral-400">({p.model_id})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Jobs I&apos;ve submitted</h2>
          <Link href="/jobs/new" className="text-sm text-neutral-500 hover:underline">
            Submit a job
          </Link>
        </div>
        {!myJobs || myJobs.length === 0 ? (
          <p className="text-sm text-neutral-500">No jobs submitted yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {myJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <span>
                    {job.material} × {job.quantity} · {job.est_points} pts
                  </span>
                  <span className="text-neutral-500">
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Jobs I&apos;m printing</h2>
          <Link href="/jobs" className="text-sm text-neutral-500 hover:underline">
            Browse open jobs
          </Link>
        </div>
        {!jobsImPrinting || jobsImPrinting.length === 0 ? (
          <p className="text-sm text-neutral-500">You&apos;re not printing anything right now.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {jobsImPrinting.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <span>
                    {job.material} × {job.quantity} · {job.est_points} pts
                  </span>
                  <span className="text-neutral-500">
                    {STATUS_LABELS[job.status] ?? job.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
