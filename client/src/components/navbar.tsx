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
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-purple-200/30 transition-all duration-300 shadow-lg shadow-purple-500/5">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="font-display font-black text-2xl tracking-tighter flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/40 group-hover:shadow-2xl group-hover:shadow-purple-500/50 transition-all group-hover:scale-105">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <span className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent">SearchAuto</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/">
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-gray-50">
              Search
            </button>
          </Link>
          <Link href="/pricing">
            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-gray-50">
              Pricing
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-secondary rounded-full transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-secondary rounded-full transition-colors">
                  Log in
                </button>
              </Link>
              <Link href="/signup">
                <button className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105">
                  Sign up
                </button>
              </Link>
            </>
          )}
          <button className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}