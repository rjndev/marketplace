import { Suspense } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { sanitizeSearch, type Listing } from "@/lib/listings";
import { supabase } from "@/lib/supabase";
import { ListingsGrid } from "@/components/ListingsGrid";
import { SearchBar } from "@/components/SearchBar";

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function Browse({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const rawCategory = first(sp.category);
  const category = CATEGORIES.find((c) => c === rawCategory);
  const q = sanitizeSearch(first(sp.q) ?? "") || undefined;

  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const listings = (data as Listing[]).map((l) => ({ ...l, price: Number(l.price) }));

  const href = (c?: string) => {
    const params = new URLSearchParams();
    if (c) params.set("category", c);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };
  const tab = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1 text-sm md:rounded-md ${
      active ? "bg-blue-600 text-white" : "hover:bg-gray-100"
    }`;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <nav aria-label="Categories" className="md:w-52 md:shrink-0">
        <h2 className="mb-2 hidden text-lg font-bold md:block">Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1 md:overflow-visible">
          <Link href={href()} className={tab(!category)}>
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={href(c)} className={tab(c === category)}>
              {c}
            </Link>
          ))}
        </div>
      </nav>
      <section className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">{category ?? "Today's picks"}</h1>
          <SearchBar q={q} category={category} />
        </div>
        <ListingsGrid
          key={`${category ?? ""}|${q ?? ""}`}
          initial={listings}
          category={category}
          q={q}
        />
      </section>
    </div>
  );
}

export default function Home(props: PageProps<"/">) {
  return (
    <main className="p-6">
      <Suspense fallback={<p className="text-gray-500">Loading listings...</p>}>
        <Browse searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
