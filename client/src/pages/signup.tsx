import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { signup, storeUser } from "@/lib/auth-api";
import { Loader2, ArrowRight, Check, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-primary w-[400px] h-[400px] -top-20 -right-20 opacity-30" />
        <div className="orb orb-accent w-[300px] h-[300px] bottom-20 -left-20 opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <span className="font-bold text-2xl text-gray-900">SearchAuto</span>
        </a>

        {/* Card */}
        <motion.div
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-200"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500">Step {step} of 3</p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="johndoe"
                    data-testid="input-username"
                  />
                  <p className="text-xs text-gray-400 mt-1">3-50 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="john@example.com"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="••••••••"
                    data-testid="input-password"
                  />
                  <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="10001"
                    data-testid="input-postal"
                  />
                  <p className="text-xs text-gray-400 mt-1">We'll show you cars nearby</p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">What type of car interests you?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {carTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSelection("carTypes", type)}
                        className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          formData.carTypes.includes(type)
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        }`}
                        data-testid={`type-${type.toLowerCase()}`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {formData.carTypes.includes(type) && <Check className="w-4 h-4" />}
                          {type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferred brands</h3>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleSelection("brands", brand)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.brands.includes(brand)
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">What's your budget?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Price</label>
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="$30,000"
                        data-testid="input-price-min"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Price</label>
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
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="$80,000"
                        data-testid="input-price-max"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-3">Fuel preference</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {fuelTypes.map((fuel) => (
                      <button
                        key={fuel}
                        type="button"
                        onClick={() => setFormData({ ...formData, fuelType: fuel })}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          formData.fuelType === fuel
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {step < 3 ? (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-indigo-700 transition-all pressable"
                  data-testid="button-next"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (step === 3) {
                      signupMutation.mutate();
                    }
                  }}
                  disabled={signupMutation.isPending}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all pressable"
                  data-testid="button-signup"
                >
                  {signupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </motion.button>
              )}
            </div>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 font-medium hover:underline">
              Log in
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
