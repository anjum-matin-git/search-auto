import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { signup, storeUser } from "@/lib/auth-api";
import { Loader2, ArrowRight, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    postalCode: "",
    carTypes: [] as string[],
    brands: [] as string[],
    priceMin: "",
    priceMax: "",
    fuelType: "",
  });

  const signupMutation = useMutation({
    mutationFn: () => {
      const priceRange: any = {};
      if (formData.priceMin && !isNaN(parseInt(formData.priceMin))) {
        priceRange.min = parseInt(formData.priceMin);
      }
      if (formData.priceMax && !isNaN(parseInt(formData.priceMax))) {
        priceRange.max = parseInt(formData.priceMax);
      }
      
      return signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        postalCode: formData.postalCode || undefined,
        location: formData.postalCode || undefined,
        initialPreferences: {
          carTypes: formData.carTypes,
          brands: formData.brands,
          priceRange: Object.keys(priceRange).length > 0 ? priceRange : undefined,
          fuelType: formData.fuelType || undefined,
        },
      });
    },
    onSuccess: (data) => {
      storeUser(data.user);
      toast.success("Welcome to SearchAuto!");
      setLocation("/");
    },
    onError: (error: any) => {
      if (error.response?.data?.detail) {
        const details = error.response.data.detail;
        if (Array.isArray(details) && details.length > 0) {
          toast.error(details[0].msg || "Validation failed");
        } else if (typeof details === 'string') {
          toast.error(details);
        } else {
          toast.error("Please check your input and try again");
        }
      } else {
        toast.error(error.message || "Signup failed");
      }
    },
  });

  const carTypes = ["SUV", "Sedan", "Sports", "Truck", "Electric", "Coupe"];
  const brands = ["Tesla", "BMW", "Mercedes", "Audi", "Porsche", "Lexus", "Toyota", "Honda"];
  const fuelTypes = ["Electric", "Gas", "Hybrid", "Diesel"];

  const toggleSelection = (field: "carTypes" | "brands", value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.username || !formData.email || !formData.password)) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    return false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < 3) {
        handleNext();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-secondary/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <a href="/" className="flex items-center justify-center mb-8">
          <Logo textClassName="text-2xl" />
        </a>

        {/* Card */}
        <div className="bg-card/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-border shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-secondary"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: s * 0.1 }}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="johndoe"
                    data-testid="input-username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="john@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                    data-testid="input-password"
                  />
                  <p className="text-xs text-muted-foreground mt-2">At least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Postal Code <span className="text-muted-foreground/50">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                    placeholder="10001"
                    data-testid="input-postal"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-sm font-medium text-foreground mb-4">What type of car interests you?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {carTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSelection("carTypes", type)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          formData.carTypes.includes(type)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                        }`}
                        data-testid={`type-${type.toLowerCase()}`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {formData.carTypes.includes(type) && <Check className="w-3.5 h-3.5" />}
                          {type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-foreground mb-4">Preferred brands</h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleSelection("brands", brand)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          formData.brands.includes(brand)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                        }`}
                        data-testid={`brand-${brand.toLowerCase()}`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-sm font-medium text-foreground mb-4">What's your budget?</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">Min Price</label>
                      <input
                        type="number"
                        value={formData.priceMin}
                        onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder="$30,000"
                        data-testid="input-price-min"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">Max Price</label>
                      <input
                        type="number"
                        value={formData.priceMax}
                        onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder="$80,000"
                        data-testid="input-price-max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-4">Fuel preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {fuelTypes.map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => setFormData({ ...formData, fuelType: fuel })}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          formData.fuelType === fuel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                        }`}
                        data-testid={`fuel-${fuel.toLowerCase()}`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="h-12"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12"
                  data-testid="button-next"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (step === 3) {
                      signupMutation.mutate();
                    }
                  }}
                  disabled={signupMutation.isPending}
                  className="flex-1 h-12"
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          <p className="text-center mt-8 text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Log in
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
