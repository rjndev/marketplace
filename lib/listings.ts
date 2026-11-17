export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  email: string;
  category: string;
  image_url: string;
  created_at: string;
};

export function matchesFilters(
  l: Listing,
  category: string | undefined,
  q: string | undefined,
) {
  if (category && l.category !== category) return false;
  if (q) {
    const needle = q.toLowerCase();
    if (
      !l.title.toLowerCase().includes(needle) &&
      !l.description.toLowerCase().includes(needle)
    ) {
      return false;
    }
  }
  return true;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Strip characters that would break PostgREST's or() filter syntax.
export function sanitizeSearch(q: string) {
  return q.replace(/[%,()*\\]/g, " ").trim().slice(0, 100);
}
