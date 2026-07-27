"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { generateModelId, hashCodeWord } from "@/lib/printers";

export type CreatePrinterState = { error: string | null };

export async function createPrinter(
  _prevState: CreatePrinterState,
  formData: FormData,
): Promise<CreatePrinterState> {
  const user = await requireUser();
  const supabase = await createClient();

  const make = String(formData.get("make") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const buildVolume = String(formData.get("build_volume") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const materials = formData.getAll("materials").map(String);
  const codeWord = String(formData.get("code_word") ?? "").trim();

  if (!make || !model) {
    return { error: "Make and model are required" };
  }
  if (codeWord.length < 6) {
    return { error: "Code word must be at least 6 characters" };
  }

  const modelId = generateModelId();
  const codeWordHash = await hashCodeWord(codeWord);

  const { error } = await supabase.from("printers").insert({
    owner_id: user.id,
    make,
    model,
    build_volume: buildVolume || null,
    location: location || null,
    description: description || null,
    materials,
    model_id: modelId,
    code_word_hash: codeWordHash,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "That model ID collided with an existing one — please try again" };
    }
    return { error: error.message };
  }

  redirect(`/printers?created=${encodeURIComponent(modelId)}`);
}
