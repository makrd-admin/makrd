"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import {
  MATERIALS,
  OTHER_MATERIAL,
  FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS,
  estimatePoints,
} from "@/lib/points";
import { GLASS_INPUT } from "@/lib/ui";
import { createClient } from "@/lib/supabase/client";
import { submitJob, type SubmitJobState } from "../actions";

const initialState: SubmitJobState = { error: null };

export default function JobForm() {
  const [material, setMaterial] = useState<string>(MATERIALS[0].value);
  const [customMaterial, setCustomMaterial] = useState("");
  const [weightGrams, setWeightGrams] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, isPending] = useActionState(submitJob, initialState);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTransitionPending, startTransition] = useTransition();

  const isOther = material === OTHER_MATERIAL;
  let estimate = 0;
  try {
    estimate = estimatePoints(material, weightGrams || 1, quantity || 1);
  } catch {
    estimate = 0;
  }
  const qualifiesForFreePrint =
    weightGrams * (quantity || 1) <= FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS;
  const busy = isUploading || isPending || isTransitionPending;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("model_file") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setUploadError("A model file is required");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setIsUploading(false);
      setUploadError("You must be signed in");
      return;
    }

    // Uploaded directly from the browser to Supabase Storage rather than
    // through a Server Action — Vercel's serverless functions cap request
    // bodies well below what a real model file needs, regardless of Next's
    // own body-size config. The job-files bucket's RLS policy scopes writes
    // to the uploader's own folder, same as before.
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("job-files").upload(path, file);
    setIsUploading(false);
    if (uploadErr) {
      setUploadError(uploadErr.message);
      return;
    }

    const fd = new FormData(form);
    // The raw File is still present in `form`'s FormData at this point —
    // strip it so the server action's payload stays tiny (just the storage
    // path), which is the whole point of uploading directly to Storage first.
    fd.delete("model_file");
    fd.set("model_file_path", path);
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
      {qualifiesForFreePrint && (
        <p className="glass rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          🎁 Your first print is free, up to {FIRST_PRINT_FREE_WEIGHT_LIMIT_GRAMS}g total — this one
          qualifies if it&apos;s your first job.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Model file
        <input
          type="file"
          name="model_file"
          accept=".stl,.3mf,.step,.stp,.obj"
          required
          className="text-sm"
        />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          STL, 3MF, STEP, or OBJ.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Material
        <select
          name="material"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          className={GLASS_INPUT}
        >
          {MATERIALS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={OTHER_MATERIAL}>Other (specify)</option>
        </select>
      </label>

      {isOther && (
        <label className="flex flex-col gap-1 text-sm">
          Custom filament
          <input
            type="text"
            name="custom_material"
            value={customMaterial}
            onChange={(e) => setCustomMaterial(e.target.value)}
            placeholder="e.g. Nylon, Carbon-fiber PLA"
            required
            className={GLASS_INPUT}
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Weight (grams, total for all copies)
        <input
          type="number"
          name="weight_grams"
          min={1}
          value={weightGrams}
          onChange={(e) => setWeightGrams(Number(e.target.value))}
          className={GLASS_INPUT}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Quantity
        <input
          type="number"
          name="quantity"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className={GLASS_INPUT}
        />
      </label>

      <p className="glass rounded-xl px-4 py-3 text-sm text-neutral-600 dark:text-neutral-300">
        Estimated cost:{" "}
        <strong className="text-gradient">
          {qualifiesForFreePrint ? "Free (if first job)" : `${estimate} pts`}
        </strong>
      </p>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        We&apos;ll try to match this with a free provider automatically — if no one&apos;s available
        right now, it&apos;ll be listed on the open jobs marketplace instead.
      </p>

      {(uploadError || state.error) && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-300">
          {uploadError || state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-gradient rounded-full px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
      >
        {isUploading ? "Uploading…" : busy ? "Submitting…" : "Submit job"}
      </button>
    </form>
  );
}
