import { Link, useLocation } from "wouter";
import { Menu, User, LogOut, X } from "lucide-react";
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
          ? 'bg-background/80 backdrop-blur-lg border-b border-border' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
          >
            <Logo />
          </motion.div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/">
            <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              Search
            </span>
          </Link>
          <Link href="/pricing">
            <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
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
                  className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg border border-border hover:border-primary/30 transition-all cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.username}</span>
                </motion.div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  Log in
                </span>
              </Link>
              <Link href="/signup">
                <Button>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground"
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
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <span className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                  Search
                </span>
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                <span className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </span>
              </Link>
              
              <div className="h-px bg-border my-2" />
              
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex items-center gap-2 py-2 text-muted-foreground hover:text-primary transition-colors">
                      <User className="w-4 h-4" />
                      {user.username}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <span className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                      Log in
                    </span>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full mt-2">
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
