"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { generateModelId, hashCodeWord } from "@/lib/printers";

export async function createPrinter(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const buildVolume = String(formData.get("build_volume") ?? "").trim();
  const materials = formData.getAll("materials").map(String);
  const codeWord = String(formData.get("code_word") ?? "").trim();

  if (!make || !model) {
    throw new Error("Make and model are required");
  }
  if (codeWord.length < 6) {
    throw new Error("Code word must be at least 6 characters");
  }

  const modelId = generateModelId();
  const codeWordHash = await hashCodeWord(codeWord);

  const { error } = await supabase.from("printers").insert({
    owner_id: user.id,
    make,
    model,
    build_volume: buildVolume || null,
    materials,
    model_id: modelId,
    code_word_hash: codeWordHash,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/printers?created=${encodeURIComponent(modelId)}`);
}
