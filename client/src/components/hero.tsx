import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles, Loader2 } from "lucide-react";

interface HeroProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function Hero({ onSearch, isSearching }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Subtle Distortion Pattern Background */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="distortion" x="0" y="0" width="400" height="400" patternUnits="userSpaceOnUse">
              <path d="M0 200 Q 100 100, 200 200 T 400 200" fill="none" stroke="url(#gradient1)" strokeWidth="2"/>
              <path d="M200 0 Q 300 100, 200 200 T 200 400" fill="none" stroke="url(#gradient1)" strokeWidth="2"/>
              <circle cx="200" cy="200" r="150" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.3"/>
              <circle cx="200" cy="200" r="100" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.4"/>
              <circle cx="200" cy="200" r="50" fill="none" stroke="url(#gradient2)" strokeWidth="1" opacity="0.5"/>
            </pattern>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#distortion)" />
        </svg>
        
        {/* Subtle Gradient Orbs */}
        <div className="absolute top-20 -left-40 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-200/20 to-transparent rounded-full blur-3xl" />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-sm text-foreground/80 text-xs font-medium mb-8"
          >
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Powered by AI • Vector Search • Real-time Data</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-tight mb-6 leading-[1.1]">
            Find your <br className="hidden md:block"/>
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent font-semibold animate-gradient bg-[length:200%_auto]">
              perfect drive.
            </span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            AI-powered precision. Unmatched clarity. Discover the car that was engineered for you.
          </p>

          {/* Search Input */}
          <div className="w-full max-w-2xl mx-auto relative group">
            <div className="relative flex items-center bg-white shadow-lg shadow-black/5 rounded-2xl p-2 border border-gray-200 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-200">
              <Search className="w-6 h-6 text-muted-foreground ml-4" data-testid="icon-search" />
              <input 
                type="text"
                placeholder="Describe your dream car..."
                className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-4 py-4 text-lg font-medium outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                data-testid="input-search"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-search"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </button>
            </div>
            <div className="flex gap-3 justify-center mt-4 text-sm text-muted-foreground">
                <span>Try:</span>
                <button 
                  onClick={() => setSearchTerm("Electric SUV under $60k")}
                  className="hover:text-foreground transition-colors hover:underline"
                  data-testid="suggestion-electric"
                >
                  "Electric SUV under $60k"
                </button>
                <button 
                  onClick={() => setSearchTerm("Fastest German sedan")}
                  className="hover:text-foreground transition-colors hover:underline"
                  data-testid="suggestion-german"
                >
                  "Fastest German sedan"
                </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
