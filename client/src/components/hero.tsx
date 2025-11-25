import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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

// Animated Car Icon Component
const AnimatedCarIcon = () => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-primary"
    initial="idle"
    animate="drive"
  >
    <motion.path
      d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
      variants={{
        idle: { y: 0 },
        drive: { y: [0, -1, 0], transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } }
      }}
    />
    <motion.circle
      cx="7"
      cy="17"
      r="2"
      variants={{
        idle: { rotate: 0 },
        drive: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: "linear" } }
      }}
    />
    <motion.path
      d="M9 17h6"
      variants={{
        idle: { x: 0 },
        drive: { x: [0, 1, 0], transition: { duration: 0.2, repeat: Infinity } }
      }}
    />
    <motion.circle
      cx="17"
      cy="17"
      r="2"
      variants={{
        idle: { rotate: 0 },
        drive: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: "linear" } }
      }}
    />
  </motion.svg>
);

export function Hero({ onSearch, isSearching }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Gradient Blob 1 */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-primary/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Animated Gradient Blob 2 */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 sm:pt-20 pb-12 sm:pb-0">
        <div className="text-center space-y-10 animate-fade-in max-w-5xl mx-auto">
          {/* Badge - High Contrast & Animated Icon */}
          <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-secondary/80 backdrop-blur-md border border-white/20 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 shadow-lg hover:bg-secondary/90 transition-colors cursor-default group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full group-hover:bg-primary/40 transition-all" />
              <AnimatedCarIcon />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground tracking-wide group-hover:text-white transition-colors">
              The First AI-Native Car Search
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight font-display text-foreground leading-[0.9] px-2">
            The future of
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50">car buying</span>
          </h1>

          {/* Subheadline / Description */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed px-4">
            Experience the power of <span className="text-foreground font-medium">AI-driven</span> automotive search. 
            Find your perfect match in seconds.
          </p>

          {/* Search Bar - Centerpiece */}
          <div className="max-w-3xl mx-auto relative group mt-8 sm:mt-12 px-4">
             {/* Outer Glow */}
             <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-white/10 to-primary/30 rounded-full blur-lg opacity-50 group-hover:opacity-80 transition duration-1000"></div>
             
             <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-background/60 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-full p-2 sm:p-2 shadow-2xl hover:border-primary/40 transition-all duration-300 gap-2 sm:gap-0">
                <div className="hidden sm:flex pl-6 pr-4 text-muted-foreground">
                  <Search className="w-6 h-6" />
                </div>
                <input 
                  type="text"
                  placeholder={PLACEHOLDER_PHRASES[placeholderIndex]}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 py-3 sm:py-4 px-4 sm:px-0 text-base sm:text-xl outline-none font-light tracking-wide"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSearching}
                  data-testid="input-search"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || !searchTerm.trim()}
                  size="lg"
                  className="rounded-xl sm:rounded-full px-6 sm:px-10 h-12 sm:h-14 font-medium text-sm sm:text-base transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] bg-white text-black hover:bg-white/90 w-full sm:w-auto"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Searching
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 sm:hidden mr-2" />
                      Search
                      <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 hidden sm:inline" />
                    </>
                  )}
                </Button>
             </div>
          </div>
          
          {/* Quick Suggestions */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-6 sm:mt-10 px-4">
             {["Electric SUV", "Luxury Sedan", "Hybrid", "Vintage", "Sports Car"].map((tag) => (
               <button
                 key={tag}
                 onClick={() => setSearchTerm(tag)}
                 className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/5 text-xs sm:text-sm text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
               >
                 {tag}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Abstract Bottom Gradient instead of Car */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white rounded-full" />
        </div>
      </div>
    </section>
  );
}
