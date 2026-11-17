import Link from "next/link";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
          F
        </span>
        <span className="text-lg font-bold">Marketplace</span>
      </Link>
      <Link
        href="/create"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Create listing
      </Link>
    </header>
  );
}
