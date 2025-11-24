import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { signup, storeUser } from "@/lib/auth-api";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

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
      console.log("Calling signup API...");
      
      // Build price range only if values are valid
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
      console.log("Signup success!", data);
      storeUser(data.user);
      toast.success("Welcome to SearchAuto!");
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("Signup error:", error);
      
      // Handle validation errors from backend
      if (error.response?.data?.detail) {
        const details = error.response.data.detail;
        if (Array.isArray(details) && details.length > 0) {
          // Show first validation error
          const firstError = details[0];
          toast.error(firstError.msg || "Validation failed");
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
    // Only submit if we're on step 3
    if (step !== 3) {
      return;
    }
    console.log("Form submitted!", formData);
    signupMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting the form
    if (e.key === "Enter") {
      e.preventDefault();
      // Only advance to next step if not on the last step
      if (step < 3) {
        handleNext();
      }
      // On step 3, do nothing - user must click the button
    }
  };

  return (
    <div className="min-h-screen relative text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#050014]/85 to-[#050014]/95" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <a href="/" className="block text-center mb-8">
            <div className="inline-flex items-center gap-2 font-display font-bold text-2xl text-white">
              <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg shadow-black/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              SearchAuto
            </div>
          </a>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 rounded-3xl p-8 md:p-12 shadow-[0_35px_120px_rgba(0,0,0,0.65)] border border-white/10 backdrop-blur-2xl"
          >
            <div className="mb-8">
              <h1 className="text-4xl font-display font-bold mb-2 text-white">Join SearchAuto</h1>
              <p className="text-white/70">Let's find your perfect car together</p>
            </div>

            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    s <= step ? "bg-white" : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4 text-white">Account Details</h2>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                      placeholder="johndoe"
                      data-testid="input-username"
                    />
                    <p className="text-xs text-white/50 mt-1">3-50 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                      placeholder="john@example.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                      placeholder="••••••••"
                      data-testid="input-password"
                    />
                    <p className="text-xs text-white/50 mt-1">At least 6 characters</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Postal Code (Optional)</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                      placeholder="10001"
                      data-testid="input-postal"
                    />
                    <p className="text-xs text-white/50 mt-1">We'll show you cars nearby</p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="text-xl font-semibold text-white">What type of car interests you?</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {carTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSelection("carTypes", type)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.carTypes.includes(type)
                            ? "border-white bg-white/10 text-white"
                            : "border-white/15 hover:border-white/40 text-white/70"
                        }`}
                        data-testid={`type-${type.toLowerCase()}`}
                      >
                        {formData.carTypes.includes(type) && <Check className="w-4 h-4 mb-1" />}
                        <span className="font-medium">{type}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-white">Preferred Brands</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleSelection("brands", brand)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            formData.brands.includes(brand)
                              ? "bg-white text-black"
                              : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
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
                  <h2 className="text-xl font-semibold text-white">Budget & Preferences</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">Min Price</label>
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
                        className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none"
                        placeholder="30000"
                        data-testid="input-price-min"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">Max Price</label>
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
                        className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none"
                        placeholder="80000"
                        data-testid="input-price-max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3 text-white/80">Fuel Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {fuelTypes.map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setFormData({ ...formData, fuelType: fuel })}
                          className={`px-4 py-3 rounded-xl transition-all ${
                            formData.fuelType === fuel
                              ? "bg-white text-black"
                              : "bg-white/10 text-white/70 hover:text-white hover:bg-white/20"
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

              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 transition-all pressable"
                    data-testid="button-back"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-xl flex items-center justify-center gap-2 shadow-xl pressable"
                    data-testid="button-next"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={signupMutation.isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 pressable"
                    data-testid="button-signup"
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </motion.button>
                )}
              </div>
            </form>

            <p className="text-center mt-6 text-sm text-white/60">
              Already have an account?{" "}
              <a href="/login" className="text-white font-medium hover:underline">
                Log in
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
