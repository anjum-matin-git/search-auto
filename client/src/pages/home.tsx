import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CarCard } from "@/components/car-card";
import { AuthModal } from "@/components/auth-modal";
import { PaywallModal } from "@/components/paywall-modal";
import { ChatSidebar } from "@/components/chat-sidebar";
import { searchCars, getPersonalizedCars, type CarResult, type SearchResponse } from "@/lib/api";
import { getStoredUser } from "@/lib/auth-api";
import { getConversation } from "@/lib/assistant-api";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Home() {
  const [results, setResults] = useState<CarResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const user = getStoredUser();
  const isMobile = useIsMobile();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [autoOpenedAssistant, setAutoOpenedAssistant] = useState(false);

  const conversationPreview = useQuery({
    queryKey: ["assistant-conversation-preview"],
    queryFn: getConversation,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const personalizedCarsQuery = useQuery<SearchResponse>({
    queryKey: ["personalized-cars", user?.id],
    queryFn: getPersonalizedCars,
    enabled: !!user,
    retry: false,
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchCars(query, user?.id),
    onSuccess: (data) => {
      setResults(data.results);
      setHasSearched(true);
      setActiveQuery(data.query);
      setSearchCount(prev => prev + 1);
      
      // Show success message based on whether we have results or agent message
      if (data.message) {
        // Agent returned a text response (new ReAct agent)
        toast.success("Search complete! Check the assistant for results.");
      } else if (data.count > 0) {
        // Traditional search with structured results
        toast.success(`Found ${data.count} matching vehicles!`);
      } else {
        toast.info("Search complete. No exact matches found.");
      }
      
      // Always open assistant to show agent's response
      if (!autoOpenedAssistant || data.message) {
        setAutoOpenedAssistant(true);
        setAssistantOpen(true);
      }
      
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

  const handleSearch = (rawQuery: string, { skipDuplicate = false }: { skipDuplicate?: boolean } = {}) => {
    const query = rawQuery.trim();
    if (!query) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (skipDuplicate && query === activeQuery) {
      return;
    }
    setActiveQuery(query);
    searchMutation.mutate(query);
  };

  const locationLabel = user?.location || user?.postalCode || "Canada";
  const personalizedResults = personalizedCarsQuery.data?.results || [];
  const displayResults = hasSearched ? results : personalizedResults;
  const showResults = hasSearched || personalizedResults.length > 0;
  const isPersonalized = !hasSearched && personalizedResults.length > 0;
  const lastQueryLabel = isPersonalized ? personalizedCarsQuery.data?.query : undefined;
  useEffect(() => {
    if (!hasSearched && lastQueryLabel) {
      setActiveQuery(lastQueryLabel);
    }
  }, [lastQueryLabel, hasSearched]);
  const currentQueryLabel = hasSearched ? activeQuery : lastQueryLabel;

  const chatEnabled = hasSearched || (!!conversationPreview.data?.messages?.length);
  useEffect(() => {
    if (!chatEnabled && assistantOpen) {
      setAssistantOpen(false);
    }
  }, [chatEnabled, assistantOpen]);

  return (
    <div className="min-h-screen relative text-white bg-gradient-to-b from-black via-[#050014] to-[#050014]">
      <ChatSidebar
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        onRequireAuth={() => setShowAuthModal(true)}
        highlight={hasSearched && !assistantOpen}
        onSearchIntent={(query) => handleSearch(query, { skipDuplicate: true })}
        visible={chatEnabled}
      />
      <Navbar />
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PaywallModal 
        open={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        creditsRemaining={Math.max(0, 3 - searchCount)}
      />
      
      <main className={assistantOpen && chatEnabled && !isMobile ? "lg:pr-[420px]" : ""}>
        <Hero onSearch={handleSearch} isSearching={searchMutation.isPending} />
        
        {searchMutation.isPending && (
          <section className="py-24 container mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-10 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-white/10 flex items-center justify-center shadow-2xl shadow-black/50 border border-white/20">
                  <Loader2 className="w-10 h-10 animate-spin text-white" />
                </div>
              </div>
              <div className="text-center max-w-lg">
                <h2 className="text-3xl font-display font-bold mb-3 text-white">
                  AI Agent at Work
                </h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  Scanning AutoTrader, analyzing thousands of listings, and matching specifications to find your perfect vehicle...
                </p>
                <div className="flex gap-2 justify-center mt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/70"
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
          <section className="py-24 container mx-auto px-4 sm:px-6" data-testid="section-results">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                {!hasSearched && user ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-4 border border-white/10">
                      <MapPin className="w-3 h-3" />
                      {currentQueryLabel ? `Based on ${currentQueryLabel}` : `Near ${locationLabel}`}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight text-white">
                      {currentQueryLabel ? `Latest picks for ${currentQueryLabel}` : "Cars Near You"}
                    </h2>
                    <p className="text-white/70 text-lg max-w-md">
                      Ultra-local inventory refreshed from Canadian dealers near {locationLabel}.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium mb-4 border border-white/10">
                      <Sparkles className="w-3 h-3" />
                      AI Matched {currentQueryLabel ? `· ${currentQueryLabel}` : ""}
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-semibold mb-4 tracking-tight text-white">
                      {currentQueryLabel ? `Search results for ${currentQueryLabel}` : "Curated for You"}
                    </h2>
                    <p className="text-white/70 text-lg max-w-md">
                      Based on your latest chat or search, our AI pulled live Canadian listings that match your brief.
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {displayResults.map((car: CarResult, index: number) => (
                <CarCard key={car.id || `car-${index}`} car={car} index={index} />
              ))}
            </div>

            <div className="mt-32 py-24 bg-white/5 border border-white/10 rounded-[3rem] text-center relative overflow-hidden backdrop-blur-3xl shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
               <div className="absolute inset-0 opacity-10">
                 <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                 <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
               </div>
               <div className="relative max-w-2xl mx-auto px-6">
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-semibold mb-6 border border-white/10">
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
                   className="px-10 py-5 bg-white text-black hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/20 transition-all font-semibold rounded-full text-lg pressable" 
                   data-testid="button-deep-search"
                 >
                   New Search ↑
                 </button>
               </div>
            </div>
          </section>
        )}

        {!showResults && !searchMutation.isPending && !hasSearched && (
          <section className="py-24 container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-md mx-auto">
              {user ? (
                <p className="text-white/70">
                  {personalizedCarsQuery.isLoading ? "Loading personalized cars..." : "No cars available yet. Try searching for specific models above."}
                </p>
              ) : (
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-2xl">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-white" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Sign up to see nearby cars</h3>
                  <p className="text-white/70 mb-6">Get personalized recommendations based on your location and preferences</p>
                  <a href="/signup" className="inline-block px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 hover:shadow-lg hover:shadow-white/30 transition-all">
                    Get Started
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {hasSearched && !searchMutation.isPending && results.length === 0 && (
          <section className="py-24 container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl font-display font-semibold mb-4 text-white">No results found</h2>
              <p className="text-white/70">Try adjusting your search criteria or use different keywords.</p>
            </div>
          </section>
        )}
      </main>
      
      <footer className="bg-black/40 border-t border-white/10 py-16 px-6 backdrop-blur-3xl">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <a href="/" className="font-display font-bold text-3xl tracking-tight inline-flex items-center gap-2 text-white mb-4">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-lg shadow-black/50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              SearchAuto
            </a>
            <p className="text-white/60 text-lg max-w-md mx-auto">
              AI-powered car search made simple
            </p>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-sm text-white/50">
            © 2025 SearchAuto. Built with AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
