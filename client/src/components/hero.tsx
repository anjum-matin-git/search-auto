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
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20 bg-white">
      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium mb-8"
          >
            <Sparkles className="w-3 h-3" />
            <span>Powered by AI • Vector Search • Real-time Data</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-tight mb-6 leading-[1.1] text-gray-900">
            Find your <br className="hidden md:block"/>
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent font-semibold">
              perfect drive.
            </span>
          </h1>
          
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            AI-powered precision. Unmatched clarity. Discover the car that was engineered for you.
          </p>

          {/* Search Input */}
          <div className="w-full max-w-2xl mx-auto relative group">
            <div className="relative flex items-center bg-white shadow-sm shadow-black/5 rounded-2xl p-2 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-gray-300">
              <Search className="w-6 h-6 text-gray-400 ml-4" data-testid="icon-search" />
              <input 
                type="text"
                placeholder="Describe your dream car..."
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 px-4 py-4 text-lg font-medium outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                data-testid="input-search"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-8 py-3 bg-gray-900 text-white hover:bg-gray-800 transition-all rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="flex gap-3 justify-center mt-4 text-sm text-gray-500">
                <span>Try:</span>
                <button 
                  onClick={() => setSearchTerm("Electric SUV under $60k")}
                  className="hover:text-gray-900 transition-colors hover:underline"
                  data-testid="suggestion-electric"
                >
                  "Electric SUV under $60k"
                </button>
                <button 
                  onClick={() => setSearchTerm("Fastest German sedan")}
                  className="hover:text-gray-900 transition-colors hover:underline"
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
