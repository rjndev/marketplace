"use client";

import { useActionState } from "react";
import { sendMessage, type ActionState } from "@/app/actions";

export function MessageForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    sendMessage.bind(null, listingId),
    {},
  );

  if (state.success) {
    return <p className="text-sm text-green-700">Message sent to the seller.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="body" className="text-sm">
        Send seller a message
      </label>
      <textarea
        id="body"
        name="body"
        required
        maxLength={2000}
        defaultValue="Hi, is this still available?"
        className="h-32 rounded-xl border border-gray-300 p-3 text-sm"
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
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
