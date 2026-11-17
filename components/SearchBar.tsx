"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ q, category }: { q?: string; category?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q ?? "");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (value.trim()) params.set("q", value.trim());
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/");
    }, 300);
    return () => clearTimeout(t);
  }, [value, category, router]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search listings"
      aria-label="Search listings"
      className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
    />
  );
}
