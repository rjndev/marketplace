import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LiveListing } from "@/components/LiveListing";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/listings";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Detail({ params }: { params: PageProps<"/listing/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();

  const listing = data as Listing;
  return <LiveListing initial={{ ...listing, price: Number(listing.price) }} />;
}

export default function ListingPage(props: PageProps<"/listing/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl p-6">
      <Suspense fallback={<p className="text-gray-500">Loading listing...</p>}>
        <Detail params={props.params} />
      </Suspense>
    </main>
  );
}
