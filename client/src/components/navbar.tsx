import { Link } from "wouter";
import { Search, Menu, User, ChevronDown } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/">
          <a className="font-display font-bold text-2xl tracking-tight flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 bg-foreground text-white rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            SearchAuto
          </a>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <div className="group relative">
            <button className="flex items-center gap-1 hover:text-foreground transition-colors py-2">
              Models <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
          </div>
          <a href="#" className="hover:text-foreground transition-colors">Brands</a>
          <a href="#" className="hover:text-foreground transition-colors">Intelligence</a>
          <a href="#" className="hover:text-foreground transition-colors">Stories</a>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-secondary rounded-full transition-colors">
            Log in
          </button>
          <button className="bg-foreground text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors shadow-lg shadow-black/5">
            Sign up
          </button>
          <button className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}