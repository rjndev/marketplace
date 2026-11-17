import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLATFORM_FEE_RATE = 0.1;

export async function canAcceptPayments(accountId: string) {
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.merchant"],
  });
  return account.configuration?.merchant?.capabilities?.card_payments?.status === "active";
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
