"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PLATFORM_FEE_RATE, appUrl, stripe } from "@/lib/stripe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PaymentState = { error?: string };

export async function connectStripe(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Enter a valid email." };

  let url: string;
  try {
    const { data: existing, error } = await supabaseAdmin
      .from("sellers")
      .select("stripe_account_id")
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);

    let accountId = existing?.stripe_account_id as string | undefined;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      accountId = account.id;
      const { error: insertError } = await supabaseAdmin
        .from("sellers")
        .insert({ email, stripe_account_id: accountId });
      if (insertError) throw new Error(insertError.message);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${appUrl()}/sell/connect`,
      return_url: `${appUrl()}/sell/connect/return?email=${encodeURIComponent(email)}`,
    });
    url = link.url;
  } catch (e) {
    console.error("connectStripe failed", e);
    return { error: "Could not start Stripe onboarding. Please try again." };
  }
  redirect(url);
}

export async function buyNow(listingId: string) {
  if (!UUID_RE.test(listingId)) throw new Error("Invalid listing.");

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("id, title, price, email, status")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing || listing.status !== "available") throw new Error("Listing is not available.");

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("stripe_account_id, charges_enabled")
    .eq("email", String(listing.email).toLowerCase())
    .maybeSingle();
  if (!seller?.charges_enabled) throw new Error("Seller cannot accept payments yet.");

  const amount = Math.round(Number(listing.price) * 100);
  // Stripe minimum charge is $0.50.
  if (amount < 50) throw new Error("Price is too low to purchase.");

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: { name: listing.title },
          },
        },
      ],
      payment_intent_data: { application_fee_amount: Math.round(amount * PLATFORM_FEE_RATE) },
      metadata: { listing_id: listing.id },
      success_url: `${appUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}&acct=${seller.stripe_account_id}`,
      cancel_url: `${appUrl()}/listing/${listing.id}`,
    },
    { stripeAccount: seller.stripe_account_id },
  );
  if (!session.url) throw new Error("Could not create checkout session.");
  redirect(session.url);
}
