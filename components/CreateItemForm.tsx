"use client";

import { useActionState, useState } from "react";
import { createListing, type ActionState } from "@/app/actions";
import { CATEGORIES } from "@/lib/categories";
import { formatPrice } from "@/lib/listings";

const input = "w-full rounded-xl border border-gray-300 px-3 py-3 text-sm";

export function CreateItemForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createListing,
    {},
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  function choosePhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  // Built manually so React's post-action form reset doesn't drop the chosen file.
  function submit() {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("price", price);
    fd.set("email", email);
    fd.set("description", description);
    fd.set("category", category);
    if (photo) fd.set("photo", photo);
    formAction(fd);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr_260px]">
      <form action={submit} className="flex flex-col gap-3">
        <label className="flex h-32 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-gray-50 text-center">
          <span>{photo ? photo.name : "Add photos"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        <input
          className={input}
          placeholder="Title"
          value={title}
          maxLength={120}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={input}
          placeholder="Price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          required
          onChange={(e) => setPrice(e.target.value)}
        />
        <select
          className={input}
          value={category}
          required
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="" disabled>
            Category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          className={input}
          placeholder="Email"
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <textarea
          className={`${input} h-32`}
          placeholder="Description"
          value={description}
          maxLength={5000}
          required
          onChange={(e) => setDescription(e.target.value)}
        />
        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Publishing..." : "Next"}
        </button>
      </form>

      <div>
        <p className="mb-2 text-sm">Preview</p>
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl border border-gray-300 bg-gray-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm text-gray-400">No photo yet</span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xl font-bold">{title || "Title"}</p>
        <p className="text-xl font-bold">
          {price && Number(price) >= 0 ? formatPrice(Number(price)) : "Price"}
        </p>
        <p className="mt-4 text-sm">Listed just now in Palo Alto, CA</p>
        <p className="mt-4 text-sm">Seller information</p>
        <p className="text-sm">{email || "Email"}</p>
        {category && <p className="mt-4 text-sm text-gray-500">{category}</p>}
        {description && <p className="mt-4 whitespace-pre-wrap text-sm">{description}</p>}
      </div>
    </div>
  );
}
