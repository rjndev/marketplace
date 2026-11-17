import type Stripe from "stripe";
import { PLATFORM_FEE_RATE, canAcceptPayments, stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const listingId = session.metadata?.listing_id;
    if (session.payment_status === "paid" && listingId && event.account) {
      const amount = session.amount_total ?? 0;
      const { error } = await supabaseAdmin.from("orders").upsert(
        {
          listing_id: listingId,
          stripe_session_id: session.id,
          seller_account_id: event.account,
          buyer_email: session.customer_details?.email ?? null,
          amount_total: amount,
          application_fee: Math.round(amount * PLATFORM_FEE_RATE),
        },
        { onConflict: "stripe_session_id", ignoreDuplicates: true },
      );
      if (error) {
        console.error("order insert failed", error);
        return new Response("DB error", { status: 500 });
      }
      const { error: updateError } = await supabaseAdmin
        .from("listings")
        .update({ status: "sold" })
        .eq("id", listingId);
      if (updateError) {
        console.error("listing update failed", updateError);
        return new Response("DB error", { status: 500 });
      }
    }
  } else if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const { error } = await supabaseAdmin
      .from("sellers")
      .update({ charges_enabled: await canAcceptPayments(account.id) })
      .eq("stripe_account_id", account.id);
    if (error) {
      console.error("seller update failed", error);
      return new Response("DB error", { status: 500 });
    }
  }

  return new Response("ok");
}
