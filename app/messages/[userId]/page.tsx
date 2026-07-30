import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import DirectMessageChat from "./dm-chat";

export const metadata: Metadata = { title: "Messages · maKrd" };

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requireUser();
  const { userId } = await params;

  if (userId === user.id) {
    redirect("/messages");
  }

  const supabase = await createClient();
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (!otherProfile) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-10">
      <h1 className="mb-6 text-xl font-semibold">
        {otherProfile.username ?? otherProfile.display_name ?? "A maKr"}
      </h1>
      <DirectMessageChat currentUserId={user.id} otherUserId={otherProfile.id} />
    </main>
  );
}
