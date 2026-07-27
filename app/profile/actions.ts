"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!displayName) {
    throw new Error("Display name is required");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, location: location || null })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/profile?updated=1");
}
