import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { acceptJob } from "./actions";

export const metadata: Metadata = { title: "Open Jobs · makrd" };

export default async function JobsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "submitted")
    .neq("requester_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Open jobs</h1>
        <Link
          href="/jobs/new"
          className="btn-gradient shrink-0 self-start rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-transform hover:scale-[1.03] active:scale-[0.98] sm:self-auto"
        >
          Submit a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="glass rounded-2xl p-6 text-center text-neutral-500 dark:text-neutral-400">
          No open jobs right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <li key={job.id} className="glass flex items-center justify-between rounded-2xl p-5">
              <div>
                <p className="font-medium">
                  {job.material} × {job.quantity}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {job.est_points} pts
                </p>
              </div>
              <form action={acceptJob.bind(null, job.id)}>
                <button
                  type="submit"
                  className="btn-gradient rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  Accept
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
