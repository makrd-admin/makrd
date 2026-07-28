import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Razorpay calls this directly (server-to-server, no user session) once a
 * payment completes. This is the only place points_purchases rows ever
 * transition to 'paid' and the only place points_balance is credited for a
 * purchase — the client-side checkout handler in buy-points-form.tsx is UI
 * feedback only and must never be trusted to credit anything.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(rawBody) as {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };

  if (body.event === "payment.captured") {
    const orderId = body.payload?.payment?.entity?.order_id;
    const paymentId = body.payload?.payment?.entity?.id;
    if (orderId && paymentId) {
      const supabase = createServiceClient();
      const { error } = await supabase.rpc("complete_points_purchase", {
        p_order_id: orderId,
        p_payment_id: paymentId,
      });
      if (error) {
        // Returning 500 makes Razorpay retry — appropriate for a transient
        // DB error; complete_points_purchase is idempotent so a retry is safe.
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
