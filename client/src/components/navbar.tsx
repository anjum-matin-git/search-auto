import { Link } from "wouter";
import { Search, Menu, User } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/">
          <a className="font-display font-bold text-2xl tracking-tighter hover:text-primary transition-colors duration-300 flex items-center gap-2">
            <span className="text-primary">///</span> SEARCH AUTO
          </a>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-white transition-colors">Models</a>
          <a href="#" className="hover:text-white transition-colors">Brands</a>
          <a href="#" className="hover:text-white transition-colors">AI Features</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <User className="w-5 h-5" />
          </button>
          <button className="md:hidden p-2 hover:bg-white/5 rounded-full transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}