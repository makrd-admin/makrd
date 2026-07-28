import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/lib/ui";
import {
  acceptJob,
  cancelJob,
  releaseJob,
  startPrinting,
  markVerification,
  completeJob,
} from "../actions";

export const metadata: Metadata = { title: "Job Details · maKrd" };

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

  let fileUrl: string | null = null;
  if (isRequester || isProvider) {
    const { data: signed } = await supabase.storage
      .from("job-files")
      .createSignedUrl(job.model_file, 60 * 60);
    fileUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-10">
      <div className="glass-strong rounded-3xl p-8">
        <h1 className="mb-2 text-xl font-semibold">
          {job.material} × {job.quantity} · {job.weight_grams}g
        </h1>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="text-gradient font-medium">{job.est_points} pts</span> · Status:{" "}
          {STATUS_LABELS[job.status] ?? job.status}
        </p>

        {fileUrl && (
          <a
            href={fileUrl}
            className="mb-6 inline-block text-sm font-medium underline underline-offset-2"
          >
            Download model file
          </a>
        )}

        <div className="flex flex-col gap-3">
          {job.status === "submitted" && !isRequester && (
            <form action={acceptJob.bind(null, job.id)}>
              <button type="submit" className={BTN_PRIMARY}>
                Accept job
              </button>
            </form>
          )}

          {job.status === "submitted" && isRequester && (
            <form action={cancelJob.bind(null, job.id)}>
              <button type="submit" className={BTN_SECONDARY}>
                Cancel job
              </button>
            </form>
          )}

          {job.status === "accepted" && isProvider && (
            <>
              <form action={startPrinting.bind(null, job.id)}>
                <button type="submit" className={BTN_PRIMARY}>
                  Start printing
                </button>
              </form>
              <form action={releaseJob.bind(null, job.id)}>
                <button type="submit" className={BTN_SECONDARY}>
                  Can&apos;t do it — release back to the marketplace
                </button>
              </form>
            </>
          )}

          {job.status === "printing" && isProvider && (
            <form action={markVerification.bind(null, job.id)}>
              <button type="submit" className={BTN_PRIMARY}>
                Mark ready for verification
              </button>
            </form>
          )}

          {job.status === "verification" && isRequester && (
            <form action={completeJob.bind(null, job.id)}>
              <button type="submit" className={BTN_PRIMARY}>
                Confirm received — mark completed
              </button>
            </form>
          )}

          {job.status === "verification" && isProvider && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Waiting for the requester to confirm they received the print.
            </p>
          )}

          {(job.status === "completed" || job.status === "cancelled") && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">This job is closed.</p>
          )}
        </div>
      </div>
    </main>
  );
}
