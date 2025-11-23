import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CarCard } from "@/components/car-card";
import { AuthModal } from "@/components/auth-modal";
import { PaywallModal } from "@/components/paywall-modal";
import { searchCars, getPersonalizedCars, type CarResult } from "@/lib/api";
import { getStoredUser } from "@/lib/auth-api";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [results, setResults] = useState<CarResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const user = getStoredUser();

  const personalizedCarsQuery = useQuery({
    queryKey: ["personalized-cars", user?.id],
    queryFn: async () => {
      const data = await getPersonalizedCars();
      return data.results;
    },
    enabled: !!user,
    retry: false,
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchCars(query, user?.id),
    onSuccess: (data) => {
      setResults(data.results);
      setHasSearched(true);
      setSearchCount(prev => prev + 1);
      toast.success(`Found ${data.count} matching vehicles!`);
      
      // Show paywall after 3 searches for free users
      if (user && searchCount >= 2) {
        setTimeout(() => setShowPaywall(true), 2000);
      }
    },
    onError: (error: any) => {
      if (error.status === 402) {
        setShowPaywall(true);
      } else {
        toast.error(error.message || "Search failed. Please try again.");
      }
    },
  });

  const handleSearch = (query: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    searchMutation.mutate(query);
  };

  const displayResults = hasSearched ? results : (personalizedCarsQuery.data || []);
  const showResults = hasSearched || (personalizedCarsQuery.data && personalizedCarsQuery.data.length > 0);
  const isPersonalized = !hasSearched && personalizedCarsQuery.data;

  return (
    <div className="min-h-screen relative text-foreground">
      {/* Aurora gradient mesh background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f8] via-[#f5f3ff] to-[#faf9f8]" />
        
        {/* Animated aurora orbs */}
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-400/20 via-violet-300/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-20 right-10 w-[700px] h-[700px] bg-gradient-to-bl from-blue-400/15 via-indigo-300/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute -bottom-20 left-1/4 w-[800px] h-[800px] bg-gradient-to-tr from-pink-400/12 via-purple-300/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        <div className="absolute top-1/2 right-1/3 w-[500px] h-[500px] bg-gradient-to-tl from-violet-400/10 via-blue-300/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '15s', animationDelay: '1s' }} />
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-white/60" />
        
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
        }} />
      </div>
      <Navbar />
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PaywallModal 
        open={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        creditsRemaining={Math.max(0, 3 - searchCount)}
      />
      
      <main>
        <Hero onSearch={handleSearch} isSearching={searchMutation.isPending} />
        
        {searchMutation.isPending && (
          <section className="py-32 container mx-auto px-6">
            <div className="flex flex-col items-center justify-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-black rounded-full blur-2xl opacity-10 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-black flex items-center justify-center shadow-2xl shadow-black/20">
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                </div>
              </div>
              <div className="text-center max-w-lg">
                <h2 className="text-3xl font-display font-bold mb-3 text-gray-900">
                  AI Agent at Work
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Scanning AutoTrader, analyzing thousands of listings, and matching specifications to find your perfect vehicle...
                </p>
                <div className="flex gap-2 justify-center mt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-black"
                      style={{
                        animation: `pulse 1.5s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`
                      }}
                    />
                  ))}
                </div>
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium mb-4">
                      <MapPin className="w-3 h-3" />
                      Near {user.location || user.postalCode}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight text-gray-900">
                      Cars Near You
                    </h2>
                    <p className="text-gray-600 text-lg max-w-md">
                      Based on your location, here are some great vehicles available nearby.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium mb-4">
                      <Sparkles className="w-3 h-3" />
                      AI Matched
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight text-gray-900">
                      Curated for You
                    </h2>
                    <p className="text-gray-600 text-lg max-w-md">
                      Based on your search, our AI has selected these exceptional vehicles from real listings.
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {displayResults.map((car: CarResult, index: number) => (
                <CarCard key={car.id || `car-${index}`} car={car} index={index} />
              ))}
            </div>

            <div className="mt-32 py-24 bg-gradient-to-br from-gray-900 to-black rounded-[3rem] text-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-10">
                 <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                 <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
               </div>
               <div className="relative max-w-2xl mx-auto px-6">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-semibold mb-6">
                   <Sparkles className="w-4 h-4" />
                   Advanced AI Search
                 </div>
                 <h3 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight text-white">
                   Want to refine your search?
                 </h3>
                 <p className="text-gray-300 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
                   Scroll back up and try a more specific query to find exactly what you're looking for
                 </p>
                 <button 
                   onClick={() => {
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                     setTimeout(() => {
                       const searchInput = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
                       if (searchInput) {
                         searchInput.focus();
                         searchInput.select();
                       }
                     }, 500);
                   }}
                   className="px-10 py-5 bg-white text-black hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/20 transition-all font-semibold rounded-full text-lg" 
                   data-testid="button-deep-search"
                 >
                   New Search ↑
                 </button>
               </div>
            </div>
          </section>
        )}

        {!showResults && !searchMutation.isPending && !hasSearched && (
          <section className="py-32 container mx-auto px-6">
            <div className="text-center max-w-md mx-auto">
              {user ? (
                <p className="text-gray-600">
                  {personalizedCarsQuery.isLoading ? "Loading personalized cars..." : "No cars available yet. Try searching for specific models above."}
                </p>
              ) : (
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-black" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Sign up to see nearby cars</h3>
                  <p className="text-gray-600 mb-6">Get personalized recommendations based on your location and preferences</p>
                  <a href="/signup" className="inline-block px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-900 hover:shadow-lg hover:shadow-black/20 transition-all">
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
              <h2 className="text-2xl font-display font-semibold mb-4 text-gray-900">No results found</h2>
              <p className="text-gray-600">Try adjusting your search criteria or use different keywords.</p>
            </div>
          </section>
        )}
      </main>
      
      <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <a href="/" className="font-display font-bold text-3xl tracking-tight inline-flex items-center gap-2 text-gray-900 mb-4">
              <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              SearchAuto
            </a>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              AI-powered car search made simple
            </p>
          </div>
          
          <div className="pt-8 border-t border-gray-200 text-sm text-gray-500">
            © 2025 SearchAuto. Built with AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
