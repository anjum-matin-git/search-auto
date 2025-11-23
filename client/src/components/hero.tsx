import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import heroBg from "@assets/generated_images/white_minimalist_car_studio.png";

export function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/20 to-white z-10" />
        <img 
          src={heroBg} 
          alt="Hero Background" 
          className="w-full h-full object-cover object-center opacity-90"
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200 text-foreground/80 text-xs font-medium mb-8 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>The new standard in automotive search</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium tracking-tight mb-6 text-foreground leading-[1.1]">
            Find your <br className="hidden md:block"/>
            <span className="text-gradient font-semibold">perfect drive.</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            AI-powered precision. Unmatched clarity. Discover the car that was engineered for you.
          </p>

          {/* Search Input */}
          <div className="w-full max-w-2xl mx-auto relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-700 blur-xl"></div>
            <div className="relative flex items-center bg-white shadow-2xl shadow-black/5 rounded-2xl p-2 border border-gray-100 transition-transform duration-300 group-hover:-translate-y-1">
              <Search className="w-6 h-6 text-muted-foreground ml-4" />
              <input 
                type="text"
                placeholder="Describe your dream car..."
                className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/60 px-4 py-4 text-lg font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="px-8 py-3 bg-foreground text-white hover:bg-primary transition-colors rounded-xl font-medium flex items-center gap-2">
                Search
              </button>
            </div>
            <div className="flex gap-3 justify-center mt-4 text-sm text-muted-foreground">
                <span>Try:</span>
                <button className="hover:text-foreground transition-colors">"Electric SUV under $60k"</button>
                <button className="hover:text-foreground transition-colors">"Fastest German sedan"</button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}