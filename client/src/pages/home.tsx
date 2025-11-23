import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CarCard } from "@/components/car-card";
import { searchCars, type CarResult } from "@/lib/api";
import { getStoredUser } from "@/lib/auth-api";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import colorfulBg from "@assets/generated_images/colorful_liquid_gradient_distortion.png";

export default function Home() {
  const [results, setResults] = useState<CarResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const user = getStoredUser();

  const nearbyCarsQuery = useQuery({
    queryKey: ["nearby-cars", user?.location],
    queryFn: async () => {
      if (!user?.location && !user?.postalCode) return null;
      const location = user.location || user.postalCode || "";
      const response = await fetch(`/api/cars/nearby?location=${encodeURIComponent(location)}&limit=10`);
      if (!response.ok) throw new Error("Failed to load nearby cars");
      const data = await response.json();
      return data.cars;
    },
    enabled: !!user && (!!user.location || !!user.postalCode),
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchCars(query, user?.id),
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

  const displayResults = hasSearched ? results : (nearbyCarsQuery.data || []);
  const showResults = hasSearched || (nearbyCarsQuery.data && nearbyCarsQuery.data.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <img src={colorfulBg} alt="" className="w-full h-full object-cover" />
      </div>
      
      <Navbar />
      
      <main className="relative z-10">
        <Hero onSearch={handleSearch} isSearching={searchMutation.isPending} />
        
        {searchMutation.isPending && (
          <section className="py-32 container mx-auto px-6">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-transparent bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 blur-xl opacity-30 animate-pulse" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-display font-semibold mb-2 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  🤖 AI Agent at Work
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Scraping AutoTrader and dealership websites, analyzing specifications, and finding the perfect matches for you...
                </p>
              </div>
            </div>
          </section>
        )}

        {showResults && !searchMutation.isPending && (
          <section className="py-32 container mx-auto px-6" data-testid="section-results">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                {!hasSearched && user ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 text-xs font-medium mb-4">
                      <MapPin className="w-3 h-3" />
                      Near {user.location || user.postalCode}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight">
                      Cars Near You
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md">
                      Based on your location, here are some great vehicles available nearby.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 text-xs font-medium mb-4">
                      <Sparkles className="w-3 h-3" />
                      AI Matched
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight">
                      Curated for You
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md">
                      Based on your search, our AI has selected these exceptional vehicles from real listings.
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex gap-2 bg-secondary p-1.5 rounded-full">
                {["All", "Sports", "SUV", "Electric", "Sedan"].map((filter, i) => (
                  <button 
                    key={filter}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                      i === 0 
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`filter-${filter.toLowerCase()}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {displayResults.map((car: CarResult, index: number) => (
                <CarCard key={car.id} car={car} index={index} />
              ))}
            </div>

            <div className="mt-32 py-24 bg-gradient-to-br from-purple-50 to-cyan-50 rounded-[3rem] text-center relative overflow-hidden border border-purple-100">
               <div className="absolute inset-0 opacity-20">
                 <img src={colorfulBg} alt="" className="w-full h-full object-cover" />
               </div>
               <div className="relative z-10 max-w-2xl mx-auto px-6">
                 <h3 className="text-3xl md:text-4xl font-display font-semibold mb-6 tracking-tight bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                   Still looking for the one?
                 </h3>
                 <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                   Our deep-search algorithm can access private listings and auction data to find rare specifications.
                 </p>
                 <button className="px-10 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 font-medium rounded-full text-lg" data-testid="button-deep-search">
                   Start Deep Search
                 </button>
               </div>
            </div>
          </section>
        )}

        {!showResults && !searchMutation.isPending && !hasSearched && (
          <section className="py-32 container mx-auto px-6">
            <div className="text-center max-w-md mx-auto">
              {user ? (
                <p className="text-muted-foreground">
                  {nearbyCarsQuery.isLoading ? "Loading nearby cars..." : "No cars available in your area yet. Try searching for specific models above."}
                </p>
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-cyan-50 p-8 rounded-3xl border border-purple-100">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-xl font-semibold mb-2">Sign up to see nearby cars</h3>
                  <p className="text-muted-foreground mb-6">Get personalized recommendations based on your location and preferences</p>
                  <a href="/signup" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-full font-medium hover:shadow-lg transition-all">
                    Get Started
                  </a>
                </div>
              )}
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
      
      <footer className="bg-white border-t border-gray-100 py-20 px-6 relative z-10">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <a href="#" className="font-display font-bold text-2xl tracking-tight flex items-center gap-2 text-foreground mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 text-white rounded-lg flex items-center justify-center">
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
