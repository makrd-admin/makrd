"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { estimatePoints, estimateWeightGramsFromVolume, OTHER_MATERIAL } from "@/lib/points";
import { parseSTLVolumeCm3 } from "@/lib/stl-weight";

export type SubmitJobState = { error: string | null };

export async function submitJob(
  _prevState: SubmitJobState,
  formData: FormData,
): Promise<SubmitJobState> {
  const user = await requireUser();
  const supabase = await createClient();

  const materialField = String(formData.get("material") ?? "");
  const customMaterial = String(formData.get("custom_material") ?? "").trim();
  const material = materialField === OTHER_MATERIAL ? customMaterial : materialField;
  let weightGrams = Number(formData.get("weight_grams") ?? 0);
  const quantity = Number(formData.get("quantity") ?? 1);
  // The file itself is uploaded directly from the browser to Supabase
  // Storage before this action runs (see job-form.tsx) — Vercel's Node
  // serverless functions cap request bodies at ~4.5MB regardless of Next's
  // own serverActions.bodySizeLimit, so routing real model files through
  // this action would fail for any file above that size. This action only
  // ever receives the resulting storage path, never the file bytes.
  const path = String(formData.get("model_file_path") ?? "");

  if (!material) {
    return { error: "Enter a material" };
  }
  if (!path) {
    return { error: "A model file is required" };
  }
  if (path.split("/")[0] !== user.id) {
    return { error: "That file wasn't uploaded by you" };
  }

  // For STL files, recompute weight server-side from the actual uploaded
  // geometry rather than trusting whatever the client sent — same
  // never-trust-the-client discipline as est_points below. Other formats
  // (3MF/STEP/OBJ) fall back to trusting the client-supplied weight for now;
  // we don't have a volume parser for those yet.
  if (path.toLowerCase().endsWith(".stl")) {
    const { data: fileBlob } = await supabase.storage.from("job-files").download(path);
    if (fileBlob) {
      const volumeCm3 = parseSTLVolumeCm3(await fileBlob.arrayBuffer());
      if (volumeCm3 !== null) {
        weightGrams = estimateWeightGramsFromVolume(volumeCm3, material);
      }
    }
  }

  // Client-side estimate for UX only — the database recomputes and enforces
  // the real price server-side (see the set_job_points trigger), so this
  // value can't be tampered with in transit.
  let estPoints: number;
  try {
    estPoints = estimatePoints(material, weightGrams, quantity);
  } catch {
    return { error: "Pick a valid material, weight, and quantity" };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("jobs")
    .insert({
      requester_id: user.id,
      model_file: path,
      material,
      weight_grams: weightGrams,
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
