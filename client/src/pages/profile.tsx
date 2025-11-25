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
import { Loader2, User, Settings, Lock, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-8 text-lg">Log in to manage your profile</p>
          <Link href="/login">
            <Button size="lg">
              Go to login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-32 pb-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-2">Your Profile</h1>
            <p className="text-muted-foreground">Manage your account and search preferences</p>
          </motion.div>

          {profileQuery.isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading profile...</span>
            </div>
          )}

          {/* Personal Profile */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                <User className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Personal Profile</h2>
                <p className="text-sm text-muted-foreground">Keep your account details up to date</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Username</label>
                <input
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Location</label>
                <input
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Postal code</label>
                <input
                  value={profile.postalCode}
                  onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleProfileSave}
                disabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </motion.section>

          {/* Search Preferences */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                <Settings className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Search Preferences</h2>
                <p className="text-sm text-muted-foreground">Customize your search results</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Preferred car types</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CAR_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePreference("preferredTypes", type)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        preferences.preferredTypes.includes(type)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {preferences.preferredTypes.includes(type) && <Check className="w-3.5 h-3.5" />}
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Favorite brands</h3>
                <div className="flex flex-wrap gap-3">
                  {BRANDS.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => togglePreference("preferredBrands", brand)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        preferences.preferredBrands.includes(brand)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Fuel preference</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FUELS.map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, fuelType: fuel })}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        preferences.fuelType === fuel 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-secondary/30 text-muted-foreground hover:text-foreground border-border hover:border-primary/30"
                      }`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button
                  onClick={handlePreferencesSave}
                  disabled={preferencesMutation.isPending}
                >
                  {preferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Change Password */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-border shadow-sm"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                <Lock className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Change Password</h2>
                <p className="text-sm text-muted-foreground">Keep your account secure</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <input
                type="password"
                placeholder="New password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                className="px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handlePasswordSave}
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
