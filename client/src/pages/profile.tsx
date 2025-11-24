import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  changePasswordApi,
  fetchProfile,
  getStoredUser,
  storeUser,
  updateProfile,
  updateUserPreferences,
} from "@/lib/auth-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

const CAR_TYPES = ["SUV", "Sedan", "Sports", "Truck", "Electric", "Coupe"];
const BRANDS = ["Tesla", "BMW", "Mercedes", "Audi", "Porsche", "Lexus"];
const FUELS = ["Electric", "Gas", "Hybrid", "Diesel"];

export default function Profile() {
  const stored = getStoredUser();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({
    username: stored?.username ?? "",
    email: stored?.email ?? "",
    location: stored?.location ?? "",
    postalCode: stored?.postalCode ?? "",
  });
  const [preferences, setPreferences] = useState({
    preferredTypes: stored?.initialPreferences?.carTypes ?? [],
    preferredBrands: stored?.initialPreferences?.brands ?? [],
    fuelType: stored?.initialPreferences?.fuelType ?? "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const isAuthenticated = !!stored?.access_token;

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const data = profileQuery.data;
    setProfile({
      username: data.username,
      email: data.email,
      location: data.location ?? "",
      postalCode: data.postalCode ?? "",
    });
    setPreferences({
      preferredTypes: data.initialPreferences?.carTypes ?? [],
      preferredBrands: data.initialPreferences?.brands ?? [],
      fuelType: data.initialPreferences?.fuelType ?? "",
    });
  }, [profileQuery.data]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      storeUser({ ...(stored ?? {}), ...updated });
      queryClient.setQueryData(["profile"], updated);
      toast.success("Profile updated");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update profile"),
  });

  const preferencesMutation = useMutation({
    mutationFn: updateUserPreferences,
    onSuccess: (updated) => {
      storeUser({ ...(stored ?? {}), ...updated });
      queryClient.setQueryData(["profile"], updated);
      toast.success("Preferences saved");
    },
    onError: (error: any) => toast.error(error.message || "Failed to update preferences"),
  });

  const passwordMutation = useMutation({
    mutationFn: changePasswordApi,
    onSuccess: () => {
      toast.success("Password updated");
      setPasswords({ current: "", next: "", confirm: "" });
    },
    onError: (error: any) => toast.error(error.message || "Failed to change password"),
  });

  const togglePreference = (field: "preferredTypes" | "preferredBrands", value: string) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleProfileSave = () => {
    profileMutation.mutate({
      username: profile.username,
      email: profile.email,
      location: profile.location,
      postalCode: profile.postalCode,
    });
  };

  const handlePreferencesSave = () => {
    if (!profileQuery.data) return;
    preferencesMutation.mutate({
      userId: profileQuery.data.id,
      location: profile.location,
      postalCode: profile.postalCode,
      initialPreferences: {
        carTypes: preferences.preferredTypes,
        brands: preferences.preferredBrands,
        fuelType: preferences.fuelType,
      },
    });
  };

  const handlePasswordSave = () => {
    if (!passwords.current || !passwords.next || passwords.next !== passwords.confirm) {
      toast.error("Please verify password fields");
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwords.current,
      newPassword: passwords.next,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#050014] to-[#050014] text-white px-6">
        <p className="text-lg mb-4">Log in to manage your profile.</p>
        <Link href="/login" className="px-6 py-3 rounded-2xl bg-white text-black font-semibold pressable">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#050014]/85 to-[#050014]/95" />
      <Navbar />
      <main className="relative z-10 pt-28 pb-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl space-y-10">
          {profileQuery.isLoading && (
            <div className="flex items-center gap-3 text-white/70">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading profile...
            </div>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold">Personal Profile</h2>
              <p className="text-white/70">Keep your account details up to date.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Username</label>
                <input
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Location</label>
                <input
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Postal code</label>
                <input
                  value={profile.postalCode}
                  onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
                />
              </div>
            </div>
            <button
              className="mt-6 px-6 py-3 bg-white text-black rounded-2xl font-semibold pressable disabled:opacity-60"
              onClick={handleProfileSave}
              disabled={profileMutation.isPending}
            >
              {profileMutation.isPending ? "Saving..." : "Save profile"}
            </button>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold">Search Preferences</h2>
              <p className="text-white/70">Steer searches toward what you love.</p>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold mb-3">Preferred car types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CAR_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePreference("preferredTypes", type)}
                      className={`px-4 py-3 rounded-2xl text-sm pressable ${
                        preferences.preferredTypes.includes(type)
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Favorite brands</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => togglePreference("preferredBrands", brand)}
                      className={`px-4 py-3 rounded-2xl text-sm pressable ${
                        preferences.preferredBrands.includes(brand)
                          ? "bg-white text-black"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Fuel preference</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FUELS.map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, fuelType: fuel })}
                      className={`px-4 py-3 rounded-2xl text-sm pressable ${
                        preferences.fuelType === fuel ? "bg-white text-black" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="w-full md:w-auto mt-2 px-6 py-3 bg-white text-black rounded-2xl font-semibold pressable disabled:opacity-60"
                onClick={handlePreferencesSave}
                disabled={preferencesMutation.isPending}
              >
                {preferencesMutation.isPending ? "Saving..." : "Save preferences"}
              </button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_35px_120px_rgba(0,0,0,0.45)]"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold">Change Password</h2>
              <p className="text-white/70">Keep your account secure.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/30 outline-none"
              />
            </div>
            <button
              className="mt-6 px-6 py-3 bg-white text-black rounded-2xl font-semibold pressable disabled:opacity-60"
              onClick={handlePasswordSave}
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? "Updating..." : "Update password"}
            </button>
          </motion.section>
        </div>
      </main>
    </div>
  );
}

