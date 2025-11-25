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
import { MapPin, Sparkles, Brain, Loader2, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

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
      
      if (data.count > 0) {
        toast.success(`Found ${data.count} matching vehicles!`);
      } else if (data.message) {
        toast.info("Search complete! Check the assistant for details.");
      } else {
        toast.info("Search complete. No exact matches found.");
      }
      
      if (!autoOpenedAssistant || data.message) {
        setAutoOpenedAssistant(true);
        setAssistantOpen(true);
      }
      
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

  const locationLabel = user?.location || user?.postalCode || "your area";
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
      
      <main className={`transition-all duration-300 ${assistantOpen && chatEnabled && !isMobile ? "lg:pr-[420px]" : ""}`}>
        <Hero onSearch={handleSearch} isSearching={searchMutation.isPending} />
        
        {/* Loading State */}
        <AnimatePresence>
          {searchMutation.isPending && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 container mx-auto px-4 sm:px-6"
            >
              <div className="flex flex-col items-center justify-center gap-6">
                {/* AI Thinking Animation */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <Brain className="w-10 h-10 text-white animate-pulse" />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-3xl blur-xl animate-pulse" />
                </div>
                
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    AI is searching...
                  </h2>
                  <p className="text-gray-500 max-w-md">
                    Analyzing your query and finding the best matches from thousands of listings
                  </p>
                </div>
                
                {/* Progress steps */}
                <div className="flex items-center gap-3 mt-4">
                  {['Analyzing', 'Searching', 'Matching', 'Ranking'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.5, duration: 0.3 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm text-gray-500">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results Section */}
        {showResults && !searchMutation.isPending && (
          <section className="py-16 container mx-auto px-4 sm:px-6" data-testid="section-results">
            {/* Results Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-3">
                    {isPersonalized ? (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        Based on your preferences
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Matched Results
                      </>
                    )}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {currentQueryLabel ? (
                      <>Results for "{currentQueryLabel}"</>
                    ) : (
                      "Cars for you"
                    )}
                  </h2>
                  <p className="text-gray-500">
                    {displayResults.length} vehicles found {locationLabel && `near ${locationLabel}`}
                  </p>
                </div>
                
                {hasSearched && (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all pressable"
                  >
                    <ArrowUp className="w-4 h-4" />
                    New Search
                  </button>
                )}
              </div>
            </motion.div>
            
            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayResults.map((car: CarResult, index: number) => (
                <CarCard key={car.id || `car-${index}`} car={car} index={index} />
              ))}
            </div>

            {/* CTA Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-20 p-8 md:p-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
              </div>
              
              <div className="relative max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Refine Your Search
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Not quite what you're looking for?
                </h3>
                <p className="text-gray-300 mb-8">
                  Try a more specific search or chat with our AI assistant for personalized recommendations
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                    className="px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 transition-all font-semibold rounded-xl pressable" 
                  >
                    New Search
                  </button>
                  {chatEnabled && (
                    <button 
                      onClick={() => setAssistantOpen(true)}
                      className="px-6 py-3 bg-white/10 text-white hover:bg-white/20 transition-all font-semibold rounded-xl border border-white/20 pressable" 
                    >
                      Chat with AI
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Empty State */}
        {!showResults && !searchMutation.isPending && !hasSearched && (
          <section className="py-20 container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-md mx-auto">
              {user ? (
                <div className="flex flex-col items-center">
                  {personalizedCarsQuery.isLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                      <p className="text-gray-500">Loading personalized recommendations...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No cars yet</h3>
                      <p className="text-gray-500">
                        Try searching for specific models or features above
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm"
                >
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Get personalized results</h3>
                  <p className="text-gray-500 mb-6">
                    Sign up to see cars matched to your preferences and location
                  </p>
                  <a 
                    href="/signup" 
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all pressable"
                  >
                    Get Started Free
                  </a>
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* No Results State */}
        {hasSearched && !searchMutation.isPending && results.length === 0 && (
          <section className="py-20 container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No exact matches</h2>
              <p className="text-gray-500 mb-6">
                Try adjusting your search criteria or use different keywords
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
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all pressable"
              >
                Try Another Search
              </button>
            </div>
          </section>
        )}
        
        {/* Footer */}
        <footer className="border-t border-gray-200 py-12 px-6 mt-20 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <a href="/" className="font-bold text-xl flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </div>
                SearchAuto
              </a>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <a href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              </div>
              
              <p className="text-sm text-gray-400">
                © 2025 SearchAuto
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
