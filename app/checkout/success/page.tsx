import { Suspense } from "react";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formatPrice } from "@/lib/listings";

type Params = Promise<{ session_id?: string; acct?: string }>;

export default function SuccessPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <Success searchParams={searchParams} />
    </Suspense>
  );
}

async function Success({ searchParams }: { searchParams: Params }) {
  const { session_id, acct } = await searchParams;

  let paid = false;
  let total = 0;
  let listingId: string | undefined;
  if (session_id && acct && /^cs_/.test(session_id) && /^acct_/.test(acct)) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, undefined, {
        stripeAccount: acct,
      });
      paid = session.payment_status === "paid";
      total = (session.amount_total ?? 0) / 100;
      listingId = session.metadata?.listing_id;
    } catch {
      paid = false;
    }
  }

  const { data: order } = paid
    ? await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session_id!)
        .maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-2 text-2xl font-bold">{paid ? "Payment successful" : "Payment not found"}</h1>
      {paid && (
        <p className="mb-6 text-sm text-gray-600">
          You paid {formatPrice(total)}.{" "}
          {order ? `Order ${order.id} is confirmed.` : "Your order is being confirmed..."}
        </p>
      )}
      <Link href={listingId ? `/listing/${listingId}` : "/"} className="text-blue-600 underline">
        {listingId ? "View listing" : "Back to marketplace"}
      </Link>
    </main>
  );
}
