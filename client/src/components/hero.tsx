import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import heroBg from "@assets/generated_images/dark_abstract_distortion_background.png";

export function Hero() {
  const [searchTerm, setSearchTerm] = useState("");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Glitch text effect state
  const [glitchText, setGlitchText] = useState("FIND YOUR DREAM MACHINE");
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setGlitchText("F1ND Y0UR DR3AM M4CH1NE");
        setTimeout(() => setGlitchText("FIND YOUR DREAM MACHINE"), 100);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background Parallax */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={heroBg} 
          alt="Hero Background" 
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 flex flex-col items-center text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6 tracking-widest uppercase">
            <Sparkles className="w-3 h-3" />
            AI Powered Search Engine V2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter mb-8 text-white relative">
             <span className="relative inline-block">
               {glitchText}
               <span className="absolute top-0 left-0 -ml-1 text-primary opacity-50 animate-glitch hidden md:block">
                 {glitchText}
               </span>
               <span className="absolute top-0 left-0 ml-1 text-secondary opacity-50 animate-glitch hidden md:block" style={{ animationDelay: "0.1s" }}>
                 {glitchText}
               </span>
             </span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Experience the future of automotive discovery. Our advanced AI algorithms analyze thousands of data points to match you with the perfect vehicle.
          </p>

          {/* Search Input */}
          <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-secondary rounded-lg opacity-20 group-hover:opacity-60 transition duration-500 blur"></div>
            <div className="relative flex items-center bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-lg">
              <Search className="w-6 h-6 text-muted-foreground ml-4" />
              <input 
                type="text"
                placeholder="Describe your dream car (e.g., 'Fast electric sports car under $150k')..."
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-muted-foreground/50 px-4 py-4 text-lg font-mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="px-8 py-3 bg-white text-black font-bold hover:bg-primary hover:text-white transition-colors rounded-md font-display tracking-tight">
                SEARCH
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Scroll to Explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
      </motion.div>
    </section>
  );
}