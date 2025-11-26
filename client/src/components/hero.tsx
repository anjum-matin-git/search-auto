import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRight, Activity, Database, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

interface HeroProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const PLACEHOLDER_PHRASES = [
  "Electric SUV under $60k",
  "Luxury sedan with leather seats",
  "Sports car, low mileage",
  "Hybrid with great fuel economy",
];

// Infinite Marquee Component
const Marquee = ({ children, direction = 1, speed = 30 }: { children: React.ReactNode, direction?: number, speed?: number }) => {
  return (
    <div className="flex overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-16 py-4"
        animate={{ x: direction > 0 ? [0, -1000] : [-1000, 0] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-16 items-center text-white/30 font-medium text-xs uppercase tracking-[0.2em]">
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// Floating Car Stat Card
const StatCard = ({ icon: Icon, label, value, delay }: { icon: any, label: string, value: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-4 bg-[#0c0c0f]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[160px] hover:border-[#cffe25]/50 transition-colors group shadow-lg"
  >
    <div className="p-2.5 rounded-xl bg-[#1a1a1d] text-white group-hover:text-[#cffe25] transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-[10px] text-[#757b83] uppercase tracking-wider font-semibold mb-0.5">{label}</div>
      <div className="text-lg font-bold text-white tracking-tight">{value}</div>
    </div>
  </motion.div>
);

export function Hero({ onSearch, isSearching }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    if (searchTerm) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PHRASES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [searchTerm]);

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
    <section className="relative min-h-[110vh] flex flex-col items-center justify-center overflow-hidden bg-[#010104] text-white selection:bg-[#cffe25]/30 selection:text-black">
      {/* CAR BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover sm:bg-cover bg-[center_bottom] bg-no-repeat opacity-100"
          style={{ 
            backgroundImage: "url('https://framerusercontent.com/images/DZxyZUiRh1CLJBFJKeCL2tghykw.jpg')",
            filter: "brightness(1.2) contrast(1.1)" 
          }} 
        />
        
        {/* Top Fade (Reduced opacity for more brightness) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#010104] via-[#010104]/40 to-transparent" />
        
        {/* Bottom Fade (seamless blend) */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#010104] to-transparent" />
        
        {/* Setrex "Electric Lime" Glows */}
        <motion.div 
          className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[60vw] h-[40vw] bg-[#cffe25]/5 rounded-full blur-[150px]"
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Top Marquee */}
      <div className="absolute top-24 left-0 right-0 z-10 opacity-60 border-y border-white/5 bg-[#010104]/50 backdrop-blur-sm hidden sm:block">
        <Marquee speed={40}>
          <span className="flex items-center gap-3"> THE ELECTRIC CAR ERA IS UPON US</span>
          <span className="flex items-center gap-3 text-[#cffe25]">●</span>
          <span className="flex items-center gap-3"> AI-POWERED AUTOMOTIVE SEARCH</span>
          <span className="flex items-center gap-3 text-[#cffe25]">●</span>
          <span className="flex items-center gap-3"> REAL-TIME MARKET DATA</span>
          <span className="flex items-center gap-3 text-[#cffe25]">●</span>
        </Marquee>
      </div>

      <motion.div 
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20 flex flex-col items-center pt-32 sm:pt-40"
        style={{ y: y1, opacity }}
      >
        {/* Setrex Style Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1a1a1d]/80 backdrop-blur-md border border-white/10 cursor-default hover:border-[#cffe25]/30 transition-colors"
        >
          <div className="flex items-center justify-center bg-[#cffe25] rounded-full w-6 h-6 overflow-hidden relative">
            <motion.svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="w-3.5 h-3.5 text-black absolute"
              animate={{ 
                x: [-12, 12],
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.5
              }}
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </motion.svg>
          </div>
          <span className="text-xs font-medium text-white/90 tracking-wide pr-1">The First AI-Native Car Search</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-center tracking-tighter font-display mb-8 leading-[0.95] drop-shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
        >
          <span className="block text-white">
            Find your dream car
          </span>
          <span className="block text-[#757b83]">
            with <span className="text-[#cffe25]">AI precision.</span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-lg sm:text-xl md:text-2xl text-white/70 text-center max-w-2xl font-light leading-relaxed mb-12 drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          The intelligent search engine for automotive enthusiasts.
          Real-time listings, <span className="text-white font-medium">market analysis</span>, zero friction.
        </motion.p>

        {/* Search Interface - Setrex Style */}
        <motion.div 
          className="w-full max-w-3xl relative group z-30"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {/* Glow Effect */}
          <div className="absolute -inset-px bg-gradient-to-r from-[#cffe25]/50 via-white/20 to-[#cffe25]/50 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-700" />
          
          {/* Glass Container */}
          <div className="relative flex flex-col sm:flex-row items-center bg-[#0c0c0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 group-hover:ring-[#cffe25]/20 transition-all">
            <div className="pl-4 sm:pl-6 text-[#757b83] hidden sm:block group-focus-within:text-[#cffe25] transition-colors">
              <Search className="w-6 h-6" />
            </div>
            
            <input 
              type="text"
              placeholder={PLACEHOLDER_PHRASES[placeholderIndex]}
              className="flex-1 bg-transparent text-white placeholder:text-[#757b83] py-4 px-4 text-lg sm:text-xl outline-none font-light tracking-wide w-full caret-[#cffe25]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
            />
            
            <div className="p-1 w-full sm:w-auto">
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                size="lg"
                className="w-full sm:w-auto h-14 px-8 rounded-xl bg-[#cffe25] text-[#010104] hover:bg-[#d8f7d6] font-bold text-base transition-all shadow-[0_0_20px_rgba(207,254,37,0.2)] hover:shadow-[0_0_30px_rgba(207,254,37,0.4)] flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Search Inventory <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Filters - Moved Here */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mt-6 relative z-30 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          {["Tesla Model S", "Porsche Taycan", "Lucid Air", "Rivian R1T"].map((tag, i) => (
            <button
              key={tag}
              onClick={() => setSearchTerm(tag)}
              className="px-3 py-1.5 rounded-lg bg-[#1a1a1d]/80 border border-white/5 text-xs text-[#757b83] hover:text-[#cffe25] hover:border-[#cffe25]/30 hover:bg-[#1a1a1d] transition-all uppercase tracking-wide font-medium backdrop-blur-sm"
            >
              {tag}
            </button>
          ))}
        </motion.div>

        {/* Floating Platform Stats (Market Data) */}
        <motion.div 
          className="hidden md:flex gap-4 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <StatCard icon={Database} label="Live Listings" value="50,000+" delay={0.6} />
          <StatCard icon={Activity} label="Daily Updates" value="24/7" delay={0.7} />
          <StatCard icon={ShieldCheck} label="Verified Dealers" value="5,000+" delay={0.8} />
          <StatCard icon={Globe} label="Market Coverage" value="100%" delay={0.9} />
        </motion.div>
      </motion.div>
      
      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#010104] via-[#010104]/80 to-transparent pointer-events-none z-10" />
    </section>
  );
}