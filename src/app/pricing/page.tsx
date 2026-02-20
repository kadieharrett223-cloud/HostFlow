"use client";

import { useState } from "react";
import Link from "next/link";

type BillingPeriod = "monthly" | "annual";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod | null>(null);

  const monthlyPrice = 49;
  const annualPrice = 499;
  const annualSavings = monthlyPrice * 12 - annualPrice;

  const plans = [
    {
      name: "Starter",
      monthlyPrice,
      annualPrice,
      description: "Perfect for small restaurants",
      features: [
        "1 location",
        "SMS notifications (50/month)",
        "Basic analytics",
        "Email support",
        "Real-time queue management",
        "Staff dashboard",
      ],
    },
    {
      name: "Professional",
      monthlyPrice: 99,
      annualPrice: 999,
      description: "For growing restaurants",
      features: [
        "3 locations",
        "Unlimited SMS notifications",
        "Advanced analytics",
        "Priority email & chat support",
        "Real-time queue management",
        "Staff dashboard",
        "Custom branding",
        "API access",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      monthlyPrice: 299,
      annualPrice: 2999,
      description: "For restaurant groups",
      features: [
        "Unlimited locations",
        "Unlimited SMS notifications",
        "Advanced analytics & reports",
        "24/7 phone support",
        "Real-time queue management",
        "Staff dashboard",
        "Custom branding",
        "API access",
        "Dedicated account manager",
        "Custom integrations",
      ],
    },
  ];

  const handleCheckout = async (planName: string) => {
    setSelectedPlan(billingPeriod);
    // We'll implement checkout next
    console.log(`Checkout: ${planName} - ${billingPeriod}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link href="/" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Simple, Transparent Pricing</h1>
          <p className="mt-2 text-lg text-slate-600">
            Choose the plan that's right for your restaurant
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-slate-900" : "text-slate-600"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                billingPeriod === "annual" ? "bg-teal-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  billingPeriod === "annual" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === "annual" ? "text-slate-900" : "text-slate-600"}`}>
              Annual
            </span>
            {billingPeriod === "annual" && (
              <span className="ml-3 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                Save ${annualSavings}/year
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const period = billingPeriod === "monthly" ? "/month" : "/year";

            return (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-8 transition-shadow ${
                  plan.highlighted
                    ? "border-teal-600 bg-teal-50 shadow-lg"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4 inline-block rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <h2 className="text-2xl font-bold text-slate-900">{plan.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-slate-900">${price}</span>
                  <span className="text-slate-600">{period}</span>
                </div>

                <button
                  onClick={() => handleCheckout(plan.name)}
                  disabled={selectedPlan === billingPeriod}
                  className={`mt-8 w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-700"
                      : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:bg-slate-100"
                  }`}
                >
                  {selectedPlan === billingPeriod ? "Processing..." : "Get Started"}
                </button>

                <div className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <svg
                        className="mt-1 h-5 w-5 text-teal-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Can I change plans anytime?</h3>
              <p className="mt-2 text-slate-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Do you offer a free trial?</h3>
              <p className="mt-2 text-slate-600">
                Yes, we offer a 14-day free trial for all plans. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">What payment methods do you accept?</h3>
              <p className="mt-2 text-slate-600">
                We accept all major credit and debit cards via Stripe. We also support bank transfers for Enterprise customers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Can I cancel anytime?</h3>
              <p className="mt-2 text-slate-600">
                Absolutely. You can cancel your subscription at any time. No questions asked, no long-term contracts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
