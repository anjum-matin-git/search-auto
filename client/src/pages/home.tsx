import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CarCard } from "@/components/car-card";
import { searchCars, type CarResult } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [results, setResults] = useState<CarResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchCars(query),
    onSuccess: (data) => {
      setResults(data.results);
      setHasSearched(true);
      toast.success(`Found ${data.count} matching vehicles!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Search failed. Please try again.");
    },
  });

  const handleSearch = (query: string) => {
    searchMutation.mutate(query);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main>
        <Hero onSearch={handleSearch} isSearching={searchMutation.isPending} />
        
        {searchMutation.isPending && (
          <section className="py-32 container mx-auto px-6">
            <div className="flex flex-col items-center justify-center gap-6">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <h2 className="text-2xl font-display font-semibold mb-2">🤖 AI Agent at Work</h2>
                <p className="text-muted-foreground max-w-md">
                  Scraping AutoTrader and dealership websites, analyzing specifications, and finding the perfect matches for you...
                </p>
              </div>
            </div>
          </section>
        )}

        {hasSearched && !searchMutation.isPending && results.length > 0 && (
          <section className="py-32 container mx-auto px-6" data-testid="section-results">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight">Curated for You</h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  Based on your search, our AI has selected these exceptional vehicles from real listings.
                </p>
              </div>
              
              <div className="flex gap-2 bg-secondary p-1.5 rounded-full">
                {["All", "Sports", "SUV", "Electric", "Sedan"].map((filter, i) => (
                  <button 
                    key={filter}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${i === 0 ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    data-testid={`filter-${filter.toLowerCase()}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {results.map((car, index) => (
                <CarCard key={car.id} car={car} index={index} />
              ))}
            </div>

            <div className="mt-32 py-24 bg-secondary rounded-[3rem] text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
               <div className="relative z-10 max-w-2xl mx-auto px-6">
                 <h3 className="text-3xl md:text-4xl font-display font-semibold mb-6 tracking-tight">Still looking for the one?</h3>
                 <p className="text-muted-foreground text-lg mb-10 leading-relaxed">Our deep-search algorithm can access private listings and auction data to find rare specifications.</p>
                 <button className="px-10 py-4 bg-foreground text-white hover:bg-primary transition-all duration-300 font-medium rounded-full shadow-xl shadow-black/10 hover:shadow-primary/20 text-lg" data-testid="button-deep-search">
                   Start Deep Search
                 </button>
               </div>
            </div>
          </section>
        )}

        {hasSearched && !searchMutation.isPending && results.length === 0 && (
          <section className="py-32 container mx-auto px-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl font-display font-semibold mb-4">No results found</h2>
              <p className="text-muted-foreground">Try adjusting your search criteria or use different keywords.</p>
            </div>
          </section>
        )}
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <a href="#" className="font-display font-bold text-2xl tracking-tight flex items-center gap-2 text-foreground mb-6">
                <div className="w-8 h-8 bg-foreground text-white rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
                SearchAuto
              </a>
              <p className="text-muted-foreground leading-relaxed">
                Redefining the automotive buying experience with artificial intelligence and human-centric design.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6">Platform</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Browse Cars</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">AI Match</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Sell Your Car</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-6">Legal</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>© 2025 Search Auto AI. All rights reserved.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}