import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

type PlanType = "starter" | "professional" | "enterprise";
type BillingPeriod = "monthly" | "annual";
type PriceKey = `${PlanType}_${BillingPeriod}`;

export async function POST(request: NextRequest) {
  try {
    const { planType, billingPeriod, restaurantId } = (await request.json()) as {
      planType: PlanType;
      billingPeriod: BillingPeriod;
      restaurantId: string;
    };

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Map plan to Stripe product IDs (you'll need to create these in Stripe)
    const priceIdMap: Record<PriceKey, string> = {
      starter_monthly: "price_starter_monthly",
      starter_annual: "price_starter_annual",
      professional_monthly: "price_professional_monthly",
      professional_annual: "price_professional_annual",
      enterprise_monthly: "price_enterprise_monthly",
      enterprise_annual: "price_enterprise_annual",
    };

    const key = `${planType}_${billingPeriod}` as PriceKey;
    const priceId = priceIdMap[key];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan or billing period" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("restaurant_id", restaurantId)
      .single();

    if (subscription?.stripe_customer_id) {
      stripeCustomerId = subscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          restaurant_id: restaurantId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID in database
      await supabase
        .from("subscriptions")
        .upsert({
          restaurant_id: restaurantId,
          stripe_customer_id: stripeCustomerId,
        });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        restaurant_id: restaurantId,
        plan_type: planType,
        billing_period: billingPeriod,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
