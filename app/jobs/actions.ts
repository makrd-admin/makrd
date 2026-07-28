"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { estimatePoints } from "@/lib/points";

export type SubmitJobState = { error: string | null };

export async function submitJob(
  _prevState: SubmitJobState,
  formData: FormData,
): Promise<SubmitJobState> {
  const user = await requireUser();
  const supabase = await createClient();

  const material = String(formData.get("material") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const file = formData.get("model_file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "A model file is required" };
  }

  // Client-side estimate for UX only — the database recomputes and enforces
  // the real price server-side (see the set_job_points trigger), so this
  // value can't be tampered with in transit.
  let estPoints: number;
  try {
    estPoints = estimatePoints(material, quantity);
  } catch {
    return { error: "Pick a valid material and quantity" };
  }

  const path = `${user.id}/${randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("job-files").upload(path, file);
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("jobs")
    .insert({
      requester_id: user.id,
      model_file: path,
      material,
      quantity,
      est_points: estPoints,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from("job-files").remove([path]);
    return { error: insertError?.message ?? "Could not submit job" };
  }

  // The insert's own RETURNING data reflects the row as INSERT wrote it, before
  // the auto_assign_job AFTER trigger's separate UPDATE — re-fetch to see
  // whether it got auto-matched to a free provider.
  const { data: finalJob } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", inserted.id)
    .single();

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect(finalJob?.status === "accepted" ? "/dashboard?matched=1" : "/dashboard");
}

export async function acceptJob(jobId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_job", { p_job_id: jobId });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function releaseJob(jobId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("release_job", { p_job_id: jobId });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function startPrinting(jobId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("start_printing", { p_job_id: jobId });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function markVerification(jobId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_verification", { p_job_id: jobId });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function completeJob(jobId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("complete_job", { p_job_id: jobId });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function cancelJob(jobId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_job", { p_job_id: jobId });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}
