import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Check, Sparkles, Crown, Phone } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Personal",
      icon: Sparkles,
      price: 5,
      credits: 50,
      description: "Perfect for occasional car shoppers",
      features: [
        "50 AI-powered searches",
        "Real-time listings from AutoTrader",
        "Vector similarity matching",
        "Basic search filters",
        "Email support"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      icon: Crown,
      price: 25,
      credits: null,
      description: "For serious buyers who want unlimited access",
      features: [
        "Unlimited AI searches",
        "All Personal features",
        "Advanced filtering",
        "Priority support",
        "Search history & saved cars",
        "Price drop alerts"
      ],
      cta: "Go Pro",
      popular: true
    },
    {
      name: "Premium",
      icon: Phone,
      price: null,
      credits: null,
      description: "White-glove car buying experience",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Direct dealer connections",
        "Purchase negotiation assistance",
        "Delivery coordination",
        "24/7 concierge support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-gray-900">
              Find your dream car,<br />on your budget
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your car search needs. Upgrade, downgrade, or cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-3xl p-8 ${
                    plan.popular
                      ? "bg-black text-white shadow-2xl shadow-black/20 border-2 border-black"
                      : "bg-white border-2 border-gray-200 shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-white text-black text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <Icon className={`w-10 h-10 mb-4 ${plan.popular ? "text-white" : "text-black"}`} />
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={plan.popular ? "text-gray-300" : "text-gray-600"}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    {plan.price !== null ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">${plan.price}</span>
                          <span className={plan.popular ? "text-gray-400" : "text-gray-500"}>
                            /month
                          </span>
                        </div>
                        {plan.credits && (
                          <p className={`mt-2 text-sm ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                            {plan.credits} search credits
                          </p>
                        )}
                        {!plan.credits && plan.price && (
                          <p className={`mt-2 text-sm ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
                            Unlimited searches
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-3xl font-bold">Custom</div>
                    )}
                  </div>

                  <Link href={plan.name === "Premium" ? "/contact-sales" : "/signup"}>
                    <button
                      className={`w-full py-3 px-6 rounded-xl font-semibold transition-all mb-6 ${
                        plan.popular
                          ? "bg-white text-black hover:bg-gray-100"
                          : "bg-black text-white hover:bg-gray-900"
                      }`}
                      data-testid={`plan-${plan.name.toLowerCase()}`}
                    >
                      {plan.cta}
                    </button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-white" : "text-black"
                        }`} />
                        <span className={plan.popular ? "text-gray-200" : "text-gray-600"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-12 text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "What happens after I use my credits?",
                  a: "Personal plan users can purchase additional credits or upgrade to Pro for unlimited searches. Your search history is always saved."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! Cancel your subscription anytime. You'll keep access until the end of your billing period."
                },
                {
                  q: "What's included in Premium?",
                  a: "Premium includes a dedicated account manager who helps you find, negotiate, and purchase your perfect car. Contact our sales team for custom pricing."
                }
              ].map((faq) => (
                <div key={faq.q} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
