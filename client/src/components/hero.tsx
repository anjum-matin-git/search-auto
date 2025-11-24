import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Loader2, ArrowRight, Check } from "lucide-react";

interface HeroProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function Hero({ onSearch, isSearching }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState("");

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
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-24 pb-12 text-white px-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#02000c]/50 to-[#050018]/95" />
        <div className="absolute inset-x-0 top-10 h-[560px] blur-[170px] opacity-60 mix-blend-screen" style={{ background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45), transparent 65%)" }} />
      </div>

      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-8 shadow-[0_20px_60px_rgba(6,4,20,0.45)] backdrop-blur"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span className="tracking-[0.3em] uppercase">AI-Powered Car Discovery</span>
          </motion.div>
          
          <h1 className="text-3xl sm:text-5xl xl:text-[90px] font-display font-black tracking-tight mb-6 leading-[1.05] text-white drop-shadow-[0_25px_60px_rgba(10,4,35,0.65)]">
            <span className="bg-gradient-to-r from-[#fef6ff] via-[#dedeff] to-[#b1c2ff] bg-clip-text text-transparent">
              Find your
            </span>
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#f3e9ff] via-[#c8bbff] to-white bg-clip-text text-transparent">
                perfect drive
              </span>
              <motion.div
                className="absolute -bottom-4 left-0 right-0 h-1.5 bg-gradient-to-r from-white via-[#f6d3ff] to-transparent rounded-full shadow-lg shadow-[#7c4dff]/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </h1>
          
          <p className="text-white/70 text-lg md:text-2xl max-w-3xl mx-auto mb-12 font-light leading-relaxed">
            Concierge-grade AI scours Canadian dealers, syncs with your chat assistant, and books introductions once you’re ready to buy.
          </p>

          <motion.div 
            className="w-full max-w-3xl mx-auto relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-white/10 to-white/0 blur-2xl opacity-30 group-hover:opacity-50 transition duration-500" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 bg-white/10 backdrop-blur-2xl shadow-[0_35px_120px_-25px_rgba(14,5,35,0.8)] rounded-3xl p-4 border border-white/15">
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 ml-2 shadow-inner shadow-white/20 border border-white/30">
                <Search className="w-5 h-5 text-white" data-testid="icon-search" />
              </div>
              <input 
                type="text"
                placeholder="Describe your dream car..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/50 px-2 sm:px-4 py-3 text-base sm:text-lg font-medium outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                data-testid="input-search"
              />
              <motion.button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl shadow-[#d9d6ff]/40 disabled:opacity-50 disabled:cursor-not-allowed pressable"
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

          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {["Electric SUV under $60k", "Luxury sedan with autopilot", "Fast sports car"].map((suggestion, i) => (
              <motion.button
                key={suggestion}
                onClick={() => setSearchTerm(suggestion)}
                className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium text-white/80 hover:text-white hover:border-white/70 hover:bg-white/15 hover:shadow-lg hover:shadow-[#4a2cff]/20 transition-all flex items-center gap-2 pressable"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Check className="w-3 h-3" />
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
