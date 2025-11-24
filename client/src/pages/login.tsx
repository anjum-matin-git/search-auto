import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { login, storeUser } from "@/lib/auth-api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      storeUser(data.user);
      toast.success("Welcome back!");
      setLocation("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen relative text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#050014]/85 to-[#050014]/95" />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
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
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-display font-bold mb-2 text-white">Welcome Back</h1>
              <p className="text-white/70">Log in to continue your search</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                  placeholder="john@example.com"
                  data-testid="input-email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white focus:ring-2 focus:ring-white/40 outline-none transition-all"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loginMutation.isPending}
                whileHover={{ scale: 1.01, boxShadow: "0 15px 45px rgba(0,0,0,0.35)" }}
                whileTap={{ scale: 0.99 }}
                className="w-full px-6 py-3 bg-white text-black rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 pressable"
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </motion.button>
            </form>

            <p className="text-center mt-6 text-sm text-white/60">
              Don't have an account?{" "}
              <a href="/signup" className="text-white font-medium hover:underline">
                Sign up
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
