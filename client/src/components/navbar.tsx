import { Link, useLocation } from "wouter";
import { Menu, User, LogOut } from "lucide-react";
import { getStoredUser, clearUser, type User as UserType } from "@/lib/auth-api";
import { useState, useEffect } from "react";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setLocation("/");
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-3xl border-b border-white/10 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between text-white">
        <Link href="/" className="font-display font-black text-2xl tracking-tighter flex items-center gap-3 group">
          <div className="w-9 h-9 bg-white text-black rounded-xl flex items-center justify-center shadow-xl shadow-black/70 group-hover:shadow-2xl group-hover:shadow-black/80 transition-all group-hover:-translate-y-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <span className="text-white">SearchAuto</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/">
            <button className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10 pressable">
              Search
            </button>
          </Link>
          <Link href="/pricing">
            <button className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10 pressable">
              Pricing
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/profile" className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full backdrop-blur pressable hover:text-white">
                <User className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors pressable"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors pressable">
                  Log in
                </button>
              </Link>
              <Link href="/signup">
                <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-2xl hover:shadow-black/60 hover:bg-gray-100 transition-all pressable">
                  Sign up
                </button>
              </Link>
            </>
          )}
          <button className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors text-white/80">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}