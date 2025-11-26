import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Check, Sparkles, Crown, Phone, Loader2, ArrowRight } from "lucide-react";
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
        // Fallback to static plans if API fails
        setApiPlans([]); 
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
      icon: Search,
      price: 0,
      period: "forever",
      credits: 50,
      description: "Perfect for occasional car shoppers",
      features: [
        "50 AI-powered searches",
        "Real-time listings access",
        "Basic search filters",
        "Save up to 3 favorites"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Dealer Pro",
      icon: Crown,
      price: 29,
      period: "month",
      credits: null,
      description: "For serious buyers & collectors",
      features: [
        "Unlimited AI searches",
        "Real-time market analysis",
        "Dealer invoice pricing data",
        "Concierge negotiation support",
        "Price drop alerts",
        "Priority support"
      ],
      cta: "Get Pro Access",
      popular: true
    },
    {
      name: "Premium",
      icon: Phone,
      price: null,
      period: "custom",
      credits: null,
      description: "White-glove concierge experience",
      features: [
        "Everything in Dealer Pro",
        "Dedicated account manager",
        "Direct dealer negotiation",
        "Vehicle inspection coordination",
        "Shipping & delivery logistics"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#010104] text-white selection:bg-[#cffe25]/30 selection:text-black">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#cffe25]/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-display font-medium mb-6 tracking-tight text-white">
              Simple, transparent <br />
              <span className="text-[#cffe25]">pricing</span>
            </h1>
            <p className="text-xl text-[#757b83] max-w-2xl mx-auto font-light">
              Choose the plan that fits your car search needs. No hidden fees.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {planTemplates.map((planTemplate, index) => {
              // Map API plans if available, otherwise use template
              const apiPlan = apiPlans.find(p => p.name === planTemplate.name || (planTemplate.name === "Dealer Pro" && p.name === "Pro"));
              const plan = { ...planTemplate, id: apiPlan?.id || index + 1 };
              
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 flex flex-col ${
                    plan.popular
                      ? "bg-[#cffe25] text-black shadow-[0_0_50px_rgba(207,254,37,0.15)]"
                      : "bg-[#0c0c0f] border border-white/10 text-white hover:border-white/20"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg border border-white/10">
                      Best Value
                    </div>
                  )}

                  <div className="mb-8">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${
                      plan.popular ? "border-black/10 text-black" : "bg-[#1a1a1d] border-white/10 text-white"
                    }`}>
                      <plan.icon className="w-6 h-6" />
                    </div>
                    <h3 className={`text-2xl font-display font-medium mb-2 ${plan.popular ? "text-black" : "text-white"}`}>{plan.name}</h3>
                    <p className={`text-sm ${plan.popular ? "text-black/70 font-medium" : "text-[#757b83] font-light"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className={`mb-8 pb-8 border-b ${plan.popular ? "border-black/10" : "border-white/5"}`}>
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-display font-medium ${plan.popular ? "text-black" : "text-white"}`}>${plan.price}</span>
                        <span className={`text-sm ${plan.popular ? "text-black/60" : "text-[#757b83]"}`}>/ {plan.period}</span>
                      </div>
                    ) : (
                      <div className={`text-4xl font-display font-medium ${plan.popular ? "text-black" : "text-white"}`}>Custom</div>
                    )}
                  </div>

                  <div className="flex-grow space-y-4 mb-10">
                    {plan.features.map((feature) => (
                      <div key={feature} className={`flex items-start gap-3 text-sm ${
                        plan.popular ? "text-black/80 font-medium" : "text-[#757b83] font-light"
                      }`}>
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                          plan.popular ? "border-black/20 text-black" : "border-white/20 text-white"
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => plan.name === "Premium" ? setLocation("/contact-sales") : handleCheckout(plan.id, plan.name)}
                    disabled={loading === plan.id}
                    className={`w-full h-14 rounded-full text-base font-bold transition-all ${
                      plan.popular 
                        ? "bg-black text-white hover:bg-black/80 hover:shadow-lg" 
                        : "bg-transparent border border-white/10 hover:bg-white hover:text-black hover:border-transparent"
                    }`}
                    variant="ghost"
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        {plan.cta} {plan.popular && <ArrowRight className="w-4 h-4" />}
                      </span>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-display font-medium text-center mb-12 text-white">
              Frequently Asked Questions
            </h2>
            <div className="grid gap-6">
              {[
                {
                  q: "What happens after I use my free searches?",
                  a: "On the Personal plan, you can easily upgrade to Dealer Pro for unlimited access at any time."
                },
                {
                  q: "Can I cancel my subscription?",
                  a: "Yes! Cancel anytime from your profile settings. You'll keep access until the end of your billing cycle."
                },
                {
                  q: "What data does the AI use?",
                  a: "We aggregate real-time inventory from over 50,000 verified dealerships across the US, updated daily."
                }
              ].map((faq) => (
                <div key={faq.q} className="bg-[#0c0c0f] p-8 rounded-2xl border border-white/10">
                  <h3 className="font-medium text-white mb-3 text-lg">{faq.q}</h3>
                  <p className="text-sm text-[#757b83] leading-relaxed font-light">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}