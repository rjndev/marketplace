import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Listing } from "@/lib/listings";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listing/${listing.id}`} className="block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={listing.image_url}
          alt={listing.title}
          fill
          sizes="(min-width: 1024px) 20vw, 50vw"
          className="object-cover"
        />
      </div>
      <p className="mt-2 text-lg font-semibold">
        {formatPrice(listing.price)}
        {listing.status === "sold" && (
          <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs">Sold</span>
        )}
      </p>
      <p className="truncate text-sm">{listing.title}</p>
      <p className="text-xs text-gray-500">Palo Alto, CA</p>
    </Link>
  );
}
