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
    mutationFn: () =>
      signup({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        postalCode: formData.postalCode,
        location: formData.postalCode,
        initialPreferences: {
          carTypes: formData.carTypes,
          brands: formData.brands,
          priceRange: {
            min: formData.priceMin ? parseInt(formData.priceMin) : undefined,
            max: formData.priceMax ? parseInt(formData.priceMax) : undefined,
          },
          fuelType: formData.fuelType,
        },
      }),
    onSuccess: (data) => {
      storeUser(data.user);
      toast.success("Welcome to SearchAuto!");
      setLocation("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Signup failed");
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
    signupMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-200">
            <div className="mb-8">
              <h1 className="text-4xl font-display font-bold mb-2 text-gray-900">Join SearchAuto</h1>
              <p className="text-gray-600">Let's find your perfect car together</p>
            </div>

            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    s <= step ? "bg-black" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Account Details</h2>
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="johndoe"
                      data-testid="input-username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="john@example.com"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="••••••••"
                      data-testid="input-password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Postal Code (Optional)</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="10001"
                      data-testid="input-postal"
                    />
                    <p className="text-xs text-muted-foreground mt-1">We'll show you cars nearby</p>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="text-xl font-semibold">What type of car interests you?</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {carTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleSelection("carTypes", type)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.carTypes.includes(type)
                            ? "border-black bg-gray-50 text-gray-900"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        data-testid={`type-${type.toLowerCase()}`}
                      >
                        {formData.carTypes.includes(type) && <Check className="w-4 h-4 mb-1" />}
                        <span className="font-medium">{type}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Preferred Brands</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleSelection("brands", brand)}
                          className={`px-3 py-2 rounded-lg text-sm transition-all ${
                            formData.brands.includes(brand)
                              ? "bg-black text-white"
                              : "bg-gray-100 hover:bg-gray-200"
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
                  <h2 className="text-xl font-semibold">Budget & Preferences</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Price</label>
                      <input
                        type="number"
                        value={formData.priceMin}
                        onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="30000"
                        data-testid="input-price-min"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Price</label>
                      <input
                        type="number"
                        value={formData.priceMax}
                        onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        placeholder="80000"
                        data-testid="input-price-max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Fuel Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {fuelTypes.map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setFormData({ ...formData, fuelType: fuel })}
                          className={`px-4 py-3 rounded-xl transition-all ${
                            formData.fuelType === fuel
                              ? "bg-black text-white"
                              : "bg-gray-100 hover:bg-gray-200"
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
                    className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    data-testid="button-back"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 hover:shadow-lg hover:shadow-black/20 transition-all flex items-center justify-center gap-2"
                    data-testid="button-next"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={signupMutation.isPending}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 hover:shadow-lg hover:shadow-black/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="button-signup"
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                )}
              </div>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary font-medium hover:underline">
                Log in
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
