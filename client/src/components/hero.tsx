import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles, Loader2, ArrowRight } from "lucide-react";

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
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-white via-gray-50/50 to-white">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-8 shadow-lg shadow-black/20"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>AI-Powered Car Discovery</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl lg:text-[100px] font-display font-bold tracking-tight mb-8 leading-[1.1]">
            <span className="text-gray-900">
              Find your
            </span>
            <br />
            <span className="relative inline-block">
              <span className="text-gray-900">
                perfect drive
              </span>
              <motion.div
                className="absolute -bottom-4 left-0 right-0 h-1 bg-black rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </h1>
          
          <p className="text-gray-600 text-xl md:text-2xl max-w-3xl mx-auto mb-16 font-light leading-relaxed">
            AI scans thousands of listings to match your dream car in seconds
          </p>

          {/* Premium Search Input */}
          <motion.div 
            className="w-full max-w-3xl mx-auto relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-black rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500" />
            
            <div className="relative flex items-center bg-white shadow-2xl shadow-black/10 rounded-2xl p-3 border border-gray-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-black ml-2">
                <Search className="w-5 h-5 text-white" data-testid="icon-search" />
              </div>
              <input 
                type="text"
                placeholder="Describe your dream car..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 px-6 py-4 text-lg font-medium outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                data-testid="input-search"
              />
              <motion.button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="px-8 py-4 bg-black text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-900"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid="button-search"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching
                  </>
                ) : (
                  <>
                    Search
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            {["Electric SUV under $60k", "Luxury sedan with autopilot", "Fast sports car"].map((suggestion, i) => (
              <motion.button
                key={suggestion}
                onClick={() => setSearchTerm(suggestion)}
                className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-full text-sm text-gray-600 hover:text-gray-900 hover:border-gray-900 hover:bg-white transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full p-1">
          <motion.div
            className="w-1 h-2 bg-black rounded-full mx-auto"
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}
