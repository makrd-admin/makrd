"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { POINTS_PACKAGES } from "@/lib/points-purchase";
import { BTN_PRIMARY } from "@/lib/ui";
import { createOrder, type CreateOrderState } from "./actions";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const initialState: CreateOrderState = { error: null, order: null };

export default function BuyPointsForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createOrder, initialState);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "done">("idle");

  useEffect(() => {
    if (!state.order || !scriptReady || status !== "idle") return;
    // Guards against re-opening the Razorpay widget if this effect re-runs
    // (e.g. scriptReady flips) while a checkout is already in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("paying");

    const razorpay = new window.Razorpay({
      key: state.order.keyId,
      amount: state.order.amount,
      currency: "INR",
      name: "maKrd",
      description: "Points top-up",
      order_id: state.order.id,
      prefill: { email: state.order.email },
      theme: { color: "#a855f7" },
      handler: () => {
        // The webhook (server-to-server, signature-verified) is what
        // actually credits points — this is just UI feedback for the payer.
        setStatus("done");
        setTimeout(() => router.push("/dashboard"), 1500);
      },
      modal: {
        ondismiss: () => setStatus("idle"),
      },
    });
    razorpay.open();
  }, [state.order, scriptReady, status, router]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <form action={formAction} className="glass-strong flex flex-col gap-4 rounded-3xl p-8">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Choose a package</legend>
          {POINTS_PACKAGES.map((pkg, i) => (
            <label
              key={pkg.packageId}
              className="glass flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="packageId"
                  value={pkg.packageId}
                  defaultChecked={i === 0}
                  required
                />
                {pkg.points} points
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">₹{pkg.amountInr}</span>
            </label>
          ))}
        </fieldset>

        {state.error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-300">
            {state.error}
          </p>
        )}
        {status === "done" && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Payment received — your points will land in a moment.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || status === "paying"}
          className={`${BTN_PRIMARY} disabled:opacity-50`}
        >
          {isPending ? "Starting checkout…" : "Continue to payment"}
        </button>
      </form>
    </>
  );
}
