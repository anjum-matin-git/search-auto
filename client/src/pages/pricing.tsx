import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Check, Sparkles, Crown, Phone, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { createCheckout, getPlans, type Plan } from "@/lib/billing-api";
import { getStoredUser } from "@/lib/auth-api";
import { toast } from "sonner";

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<number | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [apiPlans, setApiPlans] = useState<Plan[]>([]);
  const [, setLocation] = useLocation();
  const user = getStoredUser();
  
  useEffect(() => {
    // Fetch plans from API
    getPlans()
      .then(setApiPlans)
      .catch((err) => {
        console.error("Failed to load plans:", err);
        toast.error("Failed to load pricing plans");
      })
      .finally(() => setPlansLoading(false));
  }, []);
  
  const handleCheckout = async (planId: number, planName: string) => {
    if (!user) {
      toast.error("Please log in to purchase a plan");
      setLocation("/login");
      return;
    }
    
    setLoading(planId);
    try {
      const { checkout_url } = await createCheckout(planId);
      window.location.href = checkout_url;
    } catch (error: any) {
      toast.error(error.message || "Failed to start checkout");
      setLoading(null);
    }
  };

  const planTemplates = [
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
    <div className="min-h-screen relative text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#050014]/85 to-[#050014]/95" />
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-white">
              Find your dream car,<br />on your budget
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Choose the plan that fits your car search needs. Upgrade, downgrade, or cancel anytime.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          {plansLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {planTemplates.map((planTemplate, index) => {
              // Match API plan by name
              const apiPlan = apiPlans.find(p => p.name === planTemplate.name);
              const plan = { ...planTemplate, id: apiPlan?.id || index + 1 };
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, boxShadow: plan.popular ? "0 25px 50px rgba(0,0,0,0.35)" : "0 25px 50px rgba(0,0,0,0.45)" }}
                  className={`relative rounded-3xl p-8 transition-all duration-300 border ${
                    plan.popular
                      ? "bg-gradient-to-br from-white to-gray-200 text-black border-transparent shadow-2xl"
                      : "bg-white/5 border-white/15 text-white shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-black text-white text-sm font-semibold rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <Icon className={`w-10 h-10 mb-4 ${plan.popular ? "text-black" : "text-white"}`} />
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={plan.popular ? "text-black/70" : "text-white/70"}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    {plan.price !== null ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold">${plan.price}</span>
                          <span className={plan.popular ? "text-black/60" : "text-white/60"}>
                            /month
                          </span>
                        </div>
                        {plan.credits && (
                          <p className={`mt-2 text-sm ${plan.popular ? "text-black/60" : "text-white/60"}`}>
                            {plan.credits} search credits
                          </p>
                        )}
                        {!plan.credits && plan.price && (
                          <p className={`mt-2 text-sm ${plan.popular ? "text-black/60" : "text-white/60"}`}>
                            Unlimited searches
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-3xl font-bold">{plan.name === "Premium" ? "Bespoke" : "Custom"}</div>
                    )}
                  </div>

                  <motion.button
                    onClick={() => plan.name === "Premium" ? setLocation("/contact-sales") : handleCheckout(plan.id, plan.name)}
                    disabled={loading === plan.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all mb-6 disabled:opacity-50 shadow-lg hover:shadow-xl pressable ${
                      plan.popular
                        ? "bg-black text-white"
                        : "bg-white text-black"
                    }`}
                    data-testid={`plan-${plan.name.toLowerCase()}`}
                  >
                    {loading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </motion.button>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          plan.popular ? "text-black" : "text-white"
                        }`} />
                        <span className={plan.popular ? "text-black/70" : "text-white/70"}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
          )}

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-12 text-white">
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
                <div key={faq.q} className="bg-white/5 rounded-2xl p-6 border border-white/15 backdrop-blur-xl">
                  <h3 className="font-semibold text-lg mb-2 text-white">{faq.q}</h3>
                  <p className="text-white/70">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
