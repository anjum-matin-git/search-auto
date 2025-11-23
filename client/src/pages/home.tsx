import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CarCard } from "@/components/car-card";
import { CARS } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <div className="scanlines" />
      <div className="grain" />
      
      <Navbar />
      
      <main>
        <Hero />
        
        <section className="py-24 px-6 container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-display font-bold mb-2">Top Matches</h2>
              <p className="text-muted-foreground">Based on your preferences and AI analysis</p>
            </div>
            
            <div className="flex gap-2">
              {["All", "Sports", "SUV", "Electric", "Sedan"].map((filter, i) => (
                <button 
                  key={filter}
                  className={`px-4 py-2 text-sm font-mono border ${i === 0 ? 'bg-white text-black border-white' : 'border-white/10 text-muted-foreground hover:border-white/30 hover:text-white'} transition-all uppercase tracking-wider`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CARS.map((car, index) => (
              <CarCard key={car.id} car={car} index={index} />
            ))}
          </div>

          <div className="mt-24 py-12 border-t border-white/10 text-center">
             <h3 className="text-2xl font-display font-bold mb-6">Can't find what you're looking for?</h3>
             <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Our AI can dig deeper into global databases to find rare and specific models.</p>
             <button className="px-8 py-4 bg-transparent border border-primary text-primary hover:bg-primary hover:text-black transition-all duration-300 font-bold font-mono tracking-wider uppercase">
               Advanced AI Search
             </button>
          </div>
        </section>
      </main>
      
      <footer className="border-t border-white/10 bg-black py-12 px-6 relative z-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <span className="text-primary font-bold text-xl">///</span>
             <span className="font-display font-bold text-xl">SEARCH AUTO</span>
          </div>
          <div className="text-muted-foreground text-sm font-mono">
            © 2025 Search Auto AI. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}