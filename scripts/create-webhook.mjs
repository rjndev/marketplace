import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpoint = await stripe.webhookEndpoints.create({
  url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`,
  connect: true,
  enabled_events: ["checkout.session.completed", "account.updated"],
});

console.log("Signing secret:", endpoint.secret);
