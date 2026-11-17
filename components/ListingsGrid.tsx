"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { matchesFilters, type Listing } from "@/lib/listings";
import { ListingCard } from "./ListingCard";

function normalize(row: Listing): Listing {
  return { ...row, price: Number(row.price) };
}

export function ListingsGrid({
  initial,
  category,
  q,
}: {
  initial: Listing[];
  category?: string;
  q?: string;
}) {
  const [listings, setListings] = useState(initial);

  useEffect(() => {
    const channel = supabase
      .channel(`listings-${category ?? "all"}-${q ?? ""}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as { id?: string }).id;
            setListings((prev) => prev.filter((l) => l.id !== id));
            return;
          }
          const row = normalize(payload.new as Listing);
          setListings((prev) => {
            const rest = prev.filter((l) => l.id !== row.id);
            if (!matchesFilters(row, category, q)) return rest;
            return [row, ...rest].sort((a, b) => b.created_at.localeCompare(a.created_at));
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category, q]);

  if (listings.length === 0) {
    return <p className="py-12 text-gray-500">No listings found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
