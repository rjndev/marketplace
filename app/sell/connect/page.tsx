import { ConnectForm } from "@/components/ConnectForm";

export default function ConnectPage() {
  return (
    <main className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-2 text-2xl font-bold">Get paid for your listings</h1>
      <p className="mb-6 text-sm text-gray-600">
        Connect a Stripe account to enable Buy Now on every listing with your email.
      </p>
      <ConnectForm />
    </main>
  );
}
