"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { POINTS_PACKAGES } from "@/lib/points-purchase";

export type CreateOrderState = {
  error: string | null;
  order: { id: string; amount: number; keyId: string; email: string } | null;
};

export async function createOrder(
  _prevState: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const user = await requireUser();

  const packageId = Number(formData.get("packageId"));
  const pkg = POINTS_PACKAGES.find((p) => p.packageId === packageId);
  if (!pkg) {
    return { error: "Invalid package", order: null };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { error: "Payments aren't configured yet", order: null };
  }

  // amountInr here is only used to build the request — Razorpay's own record
  // of the order (and what the payer actually sees at checkout) is what
  // matters; our own points_purchases row is populated independently by
  // create_points_purchase below, re-deriving the amount from packageId
  // server-side rather than trusting this value.
  const razorpayRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: pkg.amountInr * 100,
      currency: "INR",
      receipt: `pts_${user.id.slice(0, 8)}_${Date.now()}`,
    }),
  });

  if (!razorpayRes.ok) {
    return { error: "Could not start checkout — please try again", order: null };
  }

  const razorpayOrder = (await razorpayRes.json()) as { id: string; amount: number };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_points_purchase", {
    p_package_id: pkg.packageId,
    p_razorpay_order_id: razorpayOrder.id,
  });

  if (error) {
    return { error: error.message, order: null };
  }

  return {
    error: null,
    order: {
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      keyId,
      email: user.email ?? "",
    },
  };
}
