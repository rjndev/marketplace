"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatPrice, timeAgo, type Listing } from "@/lib/listings";
import { buyNow } from "@/app/payments";
import { MessageForm } from "./MessageForm";

export function LiveListing({ initial }: { initial: Listing }) {
  const [listing, setListing] = useState(initial);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`listing-${initial.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings", filter: `id=eq.${initial.id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRemoved(true);
          } else {
            const row = payload.new as Listing;
            setListing({ ...row, price: Number(row.price) });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id]);

  if (removed) {
    return <p className="py-12 text-gray-500">This listing has been removed.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={listing.image_url}
          alt={listing.title}
          fill
          priority
          sizes="(min-width: 768px) 66vw, 100vw"
          className="object-contain"
        />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-2xl font-bold">{formatPrice(listing.price)}</p>
        </div>
        <p className="text-sm">
          Listed {timeAgo(listing.created_at)} in Palo Alto, CA
        </p>
        <p className="text-sm text-gray-500">{listing.category}</p>
        <p className="whitespace-pre-wrap text-sm">{listing.description}</p>
        {listing.status === "sold" ? (
          <p className="rounded-md bg-gray-100 px-4 py-2 text-center font-semibold">Sold</p>
        ) : listing.seller_ready ? (
          <form action={buyNow.bind(null, listing.id)}>
            <button className="w-full rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">
              Buy Now
            </button>
          </form>
        ) : null}
        <MessageForm listingId={listing.id} />
      </div>
    </div>
  );
}
