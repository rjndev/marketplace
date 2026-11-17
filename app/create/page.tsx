import Link from "next/link";

const TYPES = [
  { title: "Item for sale", desc: "Sell a single item.", href: "/create/item" },
  { title: "Create multiple listings", desc: "Coming soon." },
  { title: "Vehicle for sale", desc: "Coming soon." },
  { title: "Home for sale or rent", desc: "Coming soon." },
];

export default function CreatePage() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Choose listing type</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {TYPES.map((t) => {
          const card = (
            <>
              <div className="mb-3 h-12 w-12 rounded-full bg-gray-200" />
              <p className="font-semibold">{t.title}</p>
              <p className="text-sm text-gray-500">{t.desc}</p>
            </>
          );
          return t.href ? (
            <Link
              key={t.title}
              href={t.href}
              className="flex flex-col items-center rounded-xl border border-gray-200 p-4 text-center hover:border-blue-600"
            >
              {card}
            </Link>
          ) : (
            <div
              key={t.title}
              className="flex flex-col items-center rounded-xl border border-gray-100 p-4 text-center opacity-50"
            >
              {card}
            </div>
          );
        })}
      </div>
    </main>
  );
}
