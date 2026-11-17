"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/lib/supabase";

export type ActionState = { error?: string; success?: boolean };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createListing(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const price = Number(formData.get("price"));
  const photo = formData.get("photo");

  if (!title || title.length > 120) return { error: "Title is required (max 120 characters)." };
  if (!description || description.length > 5000) return { error: "Description is required (max 5000 characters)." };
  if (!Number.isFinite(price) || price < 0 || price > 1e9) return { error: "Enter a valid price." };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Enter a valid email." };
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Choose a category." };
  if (!(photo instanceof File) || photo.size === 0) return { error: "Add a photo." };
  const ext = IMAGE_EXT[photo.type];
  if (!ext) return { error: "Photo must be a JPEG, PNG, WebP or GIF." };
  if (photo.size > MAX_IMAGE_BYTES) return { error: "Photo must be under 4 MB." };

  const path = `${randomUUID()}.${ext}`;
  const upload = await supabase.storage
    .from("listing-images")
    .upload(path, photo, { contentType: photo.type });
  if (upload.error) return { error: `Photo upload failed: ${upload.error.message}` };

  const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);

  const id = randomUUID();
  const { error } = await supabase.from("listings").insert({
    id,
    title,
    description,
    price,
    email,
    category,
    image_url: pub.publicUrl,
  });
  if (error) return { error: `Could not save listing: ${error.message}` };

  redirect(`/listing/${id}`);
}

export async function sendMessage(
  listingId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > 2000) return { error: "Enter a message (max 2000 characters)." };

  const { error } = await supabase
    .from("messages")
    .insert({ listing_id: listingId, body });
  if (error) return { error: `Could not send message: ${error.message}` };

  return { success: true };
}
