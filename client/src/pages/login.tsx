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
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Subtle SVG Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="login-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="100" cy="100" r="80" fill="none" stroke="url(#login-gradient)" strokeWidth="1"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="url(#login-gradient)" strokeWidth="1"/>
            <circle cx="100" cy="100" r="40" fill="none" stroke="url(#login-gradient)" strokeWidth="1"/>
          </pattern>
          <linearGradient id="login-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#login-pattern)" />
      </svg>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-display font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">Log in to continue your search</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="john@example.com"
                  data-testid="input-email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="••••••••"
                  data-testid="input-password"
                />
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
