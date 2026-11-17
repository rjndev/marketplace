import { Suspense } from "react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { canAcceptPayments } from "@/lib/stripe";

type Params = Promise<{ email?: string }>;

export default function ConnectReturnPage({ searchParams }: { searchParams: Params }) {
  return (
    <Suspense fallback={<p className="p-6 text-gray-500">Loading...</p>}>
      <ConnectReturn searchParams={searchParams} />
    </Suspense>
  );
}

async function ConnectReturn({ searchParams }: { searchParams: Params }) {
  const email = ((await searchParams).email ?? "").trim().toLowerCase();

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("stripe_account_id")
    .eq("email", email)
    .maybeSingle();

  let ready = false;
  if (seller) {
    ready = await canAcceptPayments(seller.stripe_account_id);
    await supabaseAdmin
      .from("sellers")
      .update({ charges_enabled: ready })
      .eq("email", email);
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-2 text-2xl font-bold">
        {ready ? "You're connected" : "Onboarding incomplete"}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        {ready
          ? "Your listings now show a Buy Now button."
          : "Stripe needs more details before you can accept payments."}
      </p>
      <Link href={ready ? "/" : "/sell/connect"} className="text-blue-600 underline">
        {ready ? "Back to marketplace" : "Continue onboarding"}
      </Link>
    </main>
  );
}
