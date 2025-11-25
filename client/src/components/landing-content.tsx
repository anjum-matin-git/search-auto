import { motion } from "framer-motion";
import { Battery, Zap, Shield, Smartphone, ArrowRight, Wifi, Cpu, Globe, Layers, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingContent() {
  return (
    <div className="bg-background text-foreground overflow-hidden">
      {/* TECHNOLOGY / AI SECTION */}
      <section className="py-16 sm:py-24 md:py-32 relative border-t border-white/5">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 md:mb-20">
             <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                <span className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-muted-foreground">Powered by Intelligence</span>
             </div>
             <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold tracking-tight mb-6 sm:mb-8 px-4">
                Search that <br />
                <span className="text-gradient">actually understands</span>
             </h2>
             <p className="text-base sm:text-lg md:text-xl text-muted-foreground/80 font-light leading-relaxed max-w-2xl mx-auto px-4">
                Forget keywords. Our neural engine processes natural language to find vehicles that match your lifestyle, not just a spec sheet.
             </p>
          </div>

          {/* Abstract AI Visualization Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
             {[
                { 
                  icon: Cpu, 
                  title: "Contextual Analysis", 
                  desc: "Understands 'sporty but practical' or 'good for camping'." 
                },
                { 
                  icon: Globe, 
                  title: "Global Inventory", 
                  desc: "Scans thousands of dealer inventories in real-time." 
                },
                { 
                  icon: Shield, 
                  title: "Smart Filtering", 
                  desc: "Automatically removes listings with red flags or bad history." 
                }
             ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:border-white/20 hover:shadow-2xl hover:-translate-y-1"
                >
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <item.icon className="w-6 h-6 text-primary" />
                   </div>
                   <h3 className="text-xl font-display font-semibold mb-3">{item.title}</h3>
                   <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* STATS BANNER - Minimal & Clean */}
      <section className="py-24 border-y border-white/5 bg-secondary/10 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
         <div className="container mx-auto px-6 lg:px-16 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
               {[
                  { label: "Search Time", value: "0.8s" },
                  { label: "Live Listings", value: "10k+" },
                  { label: "Dealers", value: "500+" },
                  { label: "Satisfaction", value: "99%" },
               ].map((stat, i) => (
                  <div key={i}>
                     <div className="text-4xl md:text-6xl font-display font-bold mb-2 tracking-tighter text-foreground">{stat.value}</div>
                     <div className="text-xs md:text-sm font-medium uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* CTA SECTION - Abstract & Dramatic */}
      <section className="py-40 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-background">
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-8xl font-display font-bold mb-8 tracking-tighter">
              Ready to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">accelerate?</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto mb-12 font-light">
              Join the next generation of car buyers using AI to find their perfect match without the hassle.
            </p>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              size="lg"
              className="h-16 px-12 text-lg rounded-full bg-white text-black hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] transition-all duration-500 hover:scale-105"
            >
              Start Searching <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
