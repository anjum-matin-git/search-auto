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
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Glassmorphism backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-tl from-blue-500/15 to-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }} />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white text-sm font-semibold mb-8 shadow-2xl shadow-purple-500/30"
            whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.4)' }}
            style={{ 
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.3), 0 20px 40px rgba(139, 92, 246, 0.2)'
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>AI-Powered Car Discovery</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-7xl lg:text-[110px] font-display font-black tracking-tighter mb-8 leading-[0.95]">
            <span className="bg-gradient-to-r from-gray-900 via-black to-gray-800 bg-clip-text text-transparent">
              Find your
            </span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent" style={{
                textShadow: '0 0 80px rgba(168, 85, 247, 0.3)'
              }}>
                perfect drive
              </span>
              <motion.div
                className="absolute -bottom-4 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/50"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </h1>
          
          <p className="text-gray-600 text-xl md:text-2xl max-w-3xl mx-auto mb-16 font-light leading-relaxed">
            AI scans thousands of listings to match your dream car in seconds
          </p>

          {/* Premium Search Input with Glassmorphism */}
          <motion.div 
            className="w-full max-w-3xl mx-auto relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Purple AI Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500" />
            
            <div className="relative flex items-center bg-white/80 backdrop-blur-xl shadow-2xl shadow-purple-500/10 rounded-3xl p-3 border border-purple-200/50">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 ml-2 shadow-lg shadow-purple-500/50">
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
                className="px-8 py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-2xl shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-purple-500/60"
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

          {/* Suggestions with glassmorphism */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            {["Electric SUV under $60k", "Luxury sedan with autopilot", "Fast sports car"].map((suggestion, i) => (
              <motion.button
                key={suggestion}
                onClick={() => setSearchTerm(suggestion)}
                className="px-5 py-2.5 bg-white/70 backdrop-blur-md border border-purple-200/50 rounded-full text-sm font-medium text-gray-700 hover:text-purple-700 hover:border-purple-400 hover:bg-white/90 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
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
    </section>
  );
}
