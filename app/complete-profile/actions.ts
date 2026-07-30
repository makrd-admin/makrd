"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type SetUsernameState = { error: string | null };

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export async function setUsername(
  _prevState: SetUsernameState,
  formData: FormData,
): Promise<SetUsernameState> {
  await requireUser();
  const supabase = await createClient();

  const username = String(formData.get("username") ?? "").trim();

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "3-20 characters: letters, numbers, and underscores only" };
  }

  const { error } = await supabase.rpc("set_username", { p_username: username });
  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
