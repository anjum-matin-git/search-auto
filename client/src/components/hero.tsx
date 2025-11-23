import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles, Loader2 } from "lucide-react";
import meshBg from "@assets/generated_images/3d_mesh_gradient_ai_background.png";
import holoBg from "@assets/generated_images/holographic_ai_gradient_mesh.png";

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
      {/* Animated Mesh Gradient Background */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white z-10" />
        <motion.img 
          src={meshBg} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.img 
          src={holoBg} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          animate={{
            scale: [1.1, 1, 1.1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-purple-400/30 to-cyan-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-purple-400/30 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/40 shadow-lg shadow-purple-500/10 text-foreground/80 text-xs font-medium mb-8"
            animate={{
              boxShadow: [
                "0 10px 30px -10px rgba(168, 85, 247, 0.1)",
                "0 10px 40px -10px rgba(168, 85, 247, 0.3)",
                "0 10px 30px -10px rgba(168, 85, 247, 0.1)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
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
            <motion.div 
              className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-700 blur-2xl"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative flex items-center bg-white/90 backdrop-blur-xl shadow-2xl shadow-black/5 rounded-2xl p-2 border border-white/40 transition-transform duration-300 group-hover:-translate-y-1">
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
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
