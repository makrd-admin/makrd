import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
// Razorpay purchases are on hold — points are labour-driven for now.
// The real form/integration is untouched in ./buy-points-form.tsx and the
// Razorpay webhook route; re-enable by swapping this placeholder back for
// <BuyPointsForm /> once Razorpay is ready to go live.
// import BuyPointsForm from "./buy-points-form";

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
        points.
      </p>
      <div className="glass-strong rounded-3xl p-8 text-sm text-neutral-600 dark:text-neutral-300">
        <p className="mb-2 font-medium text-neutral-800 dark:text-neutral-100">
          Buying points with real money isn&apos;t open yet.
        </p>
        <p>
          For now, points are earned by printing for other members — or from your signup bonus. Head
          to the{" "}
          <Link href="/jobs" className="underline">
            open jobs marketplace
          </Link>{" "}
          to start earning.
        </p>
      </div>
    </main>
  );
}
