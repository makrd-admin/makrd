import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { acceptJob, cancelJob, startPrinting, markVerification, completeJob } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  accepted: "Accepted",
  printing: "Printing",
  verification: "Verification",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!job) {
    notFound();
  }

  const isRequester = job.requester_id === user.id;
  const isProvider = job.provider_id === user.id;

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-2 text-xl font-semibold">
        {job.material} × {job.quantity}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        {job.est_points} pts · Status: {STATUS_LABELS[job.status] ?? job.status}
      </p>

      <div className="flex flex-col gap-3">
        {job.status === "submitted" && !isRequester && (
          <form action={acceptJob.bind(null, job.id)}>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Accept job
            </button>
          </form>
        )}

        {job.status === "submitted" && isRequester && (
          <form action={cancelJob.bind(null, job.id)}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Cancel job
            </button>
          </form>
        )}

        {job.status === "accepted" && isProvider && (
          <form action={startPrinting.bind(null, job.id)}>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Start printing
            </button>
          </form>
        )}

        {job.status === "printing" && isProvider && (
          <form action={markVerification.bind(null, job.id)}>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Mark ready for verification
            </button>
          </form>
        )}

        {job.status === "verification" && isRequester && (
          <form action={completeJob.bind(null, job.id)}>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Confirm received — mark completed
            </button>
          </form>
        )}

        {job.status === "verification" && isProvider && (
          <p className="text-sm text-neutral-500">
            Waiting for the requester to confirm they received the print.
          </p>
        )}

        {(job.status === "completed" || job.status === "cancelled") && (
          <p className="text-sm text-neutral-500">This job is closed.</p>
        )}
      </div>
    </main>
  );
}
