import Stripe from "stripe";

const stripeApiKey = process.env.STRIPE_SECRET_KEY;

if (!stripeApiKey) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(stripeApiKey, {
  apiVersion: "2024-04-10",
});
