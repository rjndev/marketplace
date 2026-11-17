import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { stripe } from "@/lib/stripe";

export default async function ConnectReturn({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const email = ((await searchParams).email ?? "").trim().toLowerCase();

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("stripe_account_id")
    .eq("email", email)
    .maybeSingle();

  let ready = false;
  if (seller) {
    const account = await stripe.accounts.retrieve(seller.stripe_account_id);
    ready = account.charges_enabled;
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
