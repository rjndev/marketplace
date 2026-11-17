"use client";

import { useActionState } from "react";
import { connectStripe, type PaymentState } from "@/app/payments";

export function ConnectForm() {
  const [state, action, pending] = useActionState<PaymentState, FormData>(connectStripe, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="text-sm font-medium" htmlFor="email">
        Email used on your listings
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        className="rounded-md border border-gray-300 px-3 py-2"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Redirecting..." : "Connect with Stripe"}
      </button>
    </form>
  );
}
