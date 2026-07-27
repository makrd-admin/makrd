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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Open jobs</h1>
        <Link
          href="/jobs/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Submit a job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-neutral-500">No open jobs right now.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div>
                <p className="font-medium">
                  {job.material} × {job.quantity}
                </p>
                <p className="text-sm text-neutral-500">{job.est_points} pts</p>
              </div>
              <form action={acceptJob.bind(null, job.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
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
