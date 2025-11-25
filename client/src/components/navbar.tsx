import { Link, useLocation } from "wouter";
import { Menu, User, LogOut, X } from "lucide-react";
import { getStoredUser, clearUser, type User as UserType } from "@/lib/auth-api";
import { useState, useEffect } from "react";

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

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled 
        ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm' 
        : 'bg-transparent'
      }
    `}>
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl flex items-center gap-2.5 group">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all
            ${scrolled 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
            }
          `}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <span className="text-gray-900">SearchAuto</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/">
            <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
              Search
            </button>
          </Link>
          <Link href="/pricing">
            <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
              Pricing
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/profile" className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Log in
                </button>
              </Link>
              <Link href="/signup">
                <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md pressable">
                  Sign up
                </button>
              </Link>
            </>
          )}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <Link href="/" onClick={closeMobileMenu}>
              <button className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Search
              </button>
            </Link>
            <Link href="/pricing" onClick={closeMobileMenu}>
              <button className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                Pricing
              </button>
            </Link>
            
            <div className="border-t border-gray-100 my-2" />
            
            {user ? (
              <>
                <Link href="/profile" onClick={closeMobileMenu}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    {user.username}
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMobileMenu}>
                  <button className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    Log in
                  </button>
                </Link>
                <Link href="/signup" onClick={closeMobileMenu}>
                  <button className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Sign up free
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
