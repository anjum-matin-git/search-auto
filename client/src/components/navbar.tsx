import { Link, useLocation } from "wouter";
import { Menu, User, LogOut, X, Sparkles } from "lucide-react";
import { getStoredUser, clearUser, type User as UserType } from "@/lib/auth-api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setMobileMenuOpen(false);
    setLocation("/");
    window.location.href = "/";
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled 
          ? 'bg-[#010104]/80 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent border-b border-transparent'
        }
      `}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer flex items-center gap-2"
          >
            <Logo />
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/">
            <span className="text-sm font-medium text-[#757b83] hover:text-white transition-colors cursor-pointer">
              Search
            </span>
          </Link>
          <Link href="/pricing">
            <span className="text-sm font-medium text-[#757b83] hover:text-white transition-colors cursor-pointer">
              Pricing
            </span>
          </Link>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/profile">
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1d] rounded-full border border-white/10 hover:border-[#cffe25]/30 transition-all cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-6 h-6 bg-[#cffe25] rounded-full flex items-center justify-center text-black">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-white">{user.username}</span>
                </motion.div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-[#757b83] hover:text-white transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm font-medium text-white hover:text-[#cffe25] transition-colors cursor-pointer">
                  Log in
                </span>
              </Link>
              <Link href="/signup">
                <Button className="bg-[#cffe25] text-black hover:bg-[#e2ff5e] rounded-full px-6 font-bold text-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#010104] border-b border-white/10"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <span className="block py-2 text-[#757b83] hover:text-[#cffe25] transition-colors">
                  Search
                </span>
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                <span className="block py-2 text-[#757b83] hover:text-[#cffe25] transition-colors">
                  Pricing
                </span>
              </Link>
              
              <div className="h-px bg-white/10 my-2" />
              
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex items-center gap-2 py-2 text-white hover:text-[#cffe25] transition-colors">
                      <User className="w-4 h-4" />
                      {user.username}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-[#757b83] hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <span className="block py-2 text-white hover:text-[#cffe25] transition-colors">
                      Log in
                    </span>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full mt-2 bg-[#cffe25] text-black rounded-full font-bold">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}