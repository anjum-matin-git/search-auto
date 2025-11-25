import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Check, Sparkles, Crown, Phone, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { createCheckout, getPlans, type Plan } from "@/lib/billing-api";
import { getStoredUser } from "@/lib/auth-api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  const [loading, setLoading] = useState<number | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [apiPlans, setApiPlans] = useState<Plan[]>([]);
  const [, setLocation] = useLocation();
  const user = getStoredUser();
  
  useEffect(() => {
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
        "Real-time listings",
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
      description: "For serious buyers",
      features: [
        "Unlimited AI searches",
        "All Personal features",
        "Advanced filtering",
        "Priority support",
        "Search history",
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
      description: "White-glove experience",
      features: [
        "Everything in Pro",
        "Dedicated manager",
        "Direct dealer connections",
        "Negotiation assistance",
        "24/7 support"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
              Simple, transparent <br />
              <span className="text-gradient">pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
              Choose the plan that fits your car search needs. No hidden fees.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          {plansLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {planTemplates.map((planTemplate, index) => {
              const apiPlan = apiPlans.find(p => p.name === planTemplate.name);
              const plan = { ...planTemplate, id: apiPlan?.id || index + 1 };
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                    plan.popular
                      ? "bg-gradient-to-b from-secondary/80 to-background border border-primary/30 shadow-2xl shadow-primary/10"
                      : "bg-card/50 backdrop-blur-sm border border-border hover:border-primary/20 hover:shadow-xl"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-8">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                      plan.popular ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    {plan.price !== null ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-display font-bold">${plan.price}</span>
                          <span className="text-muted-foreground">/mo</span>
                        </div>
                        {plan.credits && (
                          <p className="text-sm mt-2 text-primary font-medium">
                            {plan.credits} searches included
                          </p>
                        )}
                        {!plan.credits && plan.price && (
                          <p className="text-sm mt-2 text-primary font-medium">
                            Unlimited searches
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-display font-bold">Custom</div>
                    )}
                  </div>

                  <Button
                    onClick={() => plan.name === "Premium" ? setLocation("/contact-sales") : handleCheckout(plan.id, plan.name)}
                    disabled={loading === plan.id}
                    className={`w-full h-12 mb-8 ${
                      plan.popular ? "" : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                    variant={plan.popular ? "default" : "secondary"}
                    data-testid={`plan-${plan.name.toLowerCase()}`}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>

                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <div className={`mt-0.5 rounded-full p-0.5 ${
                          plan.popular ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
          )}

          {/* FAQ */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-display font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-6">
              {[
                {
                  q: "What happens after I use my credits?",
                  a: "Personal plan users can purchase additional credits seamlessly or upgrade to Pro for unlimited access."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! Cancel your subscription anytime with one click. You'll keep access until the end of your billing period."
                },
                {
                  q: "What's included in Premium?",
                  a: "Premium includes a dedicated automotive expert who manages the entire process: finding, negotiating, and arranging delivery."
                }
              ].map((faq) => (
                <div key={faq.q} className="bg-card/30 p-6 rounded-xl border border-border">
                  <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
