import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import BuyPointsForm from "./buy-points-form";

export const metadata: Metadata = { title: "Buy Points · maKrd" };

export default async function BuyPointsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("points_balance")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-lg p-6 sm:p-10">
      <h1 className="mb-2 text-xl font-semibold">Buy points</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        You have <span className="text-gradient font-medium">{profile?.points_balance ?? 0}</span>{" "}
        points. Top up with a card or UPI via Razorpay.
      </p>
      <BuyPointsForm />
    </main>
  );
}
