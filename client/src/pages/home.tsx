import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { CarCard } from "@/components/car-card";
import { AuthModal } from "@/components/auth-modal";
import { PaywallModal } from "@/components/paywall-modal";
import { ChatSidebar } from "@/components/chat-sidebar";
import { LandingContent } from "@/components/landing-content";
import { searchCars, getPersonalizedCars, type CarResult, type SearchResponse } from "@/lib/api";
import { getStoredUser } from "@/lib/auth-api";
import { getConversation } from "@/lib/assistant-api";
import { MapPin, ArrowUp, Search, Car, Brain, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Car SVG for loading animation
function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M52 24H56C58.2091 24 60 22.2091 60 20V18C60 16.8954 59.1046 16 58 16H54L48 8H20L12 16H6C4.89543 16 4 16.8954 4 18V20C4 22.2091 5.79086 24 8 24H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="24" r="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="46" cy="24" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M22 16H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

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
        toast.success(`Found ${data.count} matching vehicles`);
      } else if (data.message) {
        toast.info("Search complete");
      } else {
        toast.info("No exact matches found");
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
        toast.error(error.message || "Search failed");
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
  const showResults = hasSearched || (personalizedResults.length > 0 && !!user);
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

  const loadingSteps = [
    { icon: Search, text: "Analyzing query", done: true },
    { icon: Car, text: "Searching listings", done: true },
    { icon: Brain, text: "AI matching", done: false },
    { icon: Sparkles, text: "Ranking results", done: false },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
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
      
      <main className={`transition-all duration-300 ${assistantOpen && chatEnabled && !isMobile ? "lg:pr-[450px]" : ""}`}>
        <Hero onSearch={handleSearch} isSearching={searchMutation.isPending} />
        
        {/* Beautiful Loading State with Car Animation */}
        <AnimatePresence>
          {searchMutation.isPending && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-32 container mx-auto px-4 sm:px-6"
            >
              <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
                {/* Animated Car with Thinking Brain */}
                <div className="relative mb-12">
                  {/* Pulse rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border border-primary/20 pulse-ring" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border border-primary/10 pulse-ring" style={{ animationDelay: '0.5s' }} />
                  </div>
                  
                  {/* Main container */}
                  <motion.div 
                    className="relative w-40 h-40 rounded-3xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-2xl"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {/* Scan line effect */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-primary/10 to-transparent scan-line" />
                    </div>
                    
                    {/* Car icon */}
                    <div className="car-drive transform scale-125">
                      <CarIcon className="w-20 h-10 text-foreground car-bounce" />
                    </div>
                    
                    {/* Brain indicator */}
                    <motion.div 
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Brain className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  </motion.div>
                </div>
                
                {/* Text */}
                <motion.h2 
                  className="text-2xl font-display font-bold text-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  AI is searching
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground mb-10 font-light"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Analyzing thousands of listings for you...
                </motion.p>
                
                {/* Animated steps */}
                <div className="w-full space-y-3">
                  {loadingSteps.map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.text}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.15 }}
                        className="flex items-center gap-4 px-5 py-4 bg-card rounded-xl border border-border shadow-sm"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          i <= 1 ? 'bg-primary/10' : 'bg-secondary'
                        }`}>
                          <Icon className={`w-5 h-5 ${i <= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <span className={`text-sm font-medium ${i <= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.text}
                        </span>
                        {i <= 1 && (
                          <motion.div 
                            className="ml-auto flex gap-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.2 }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary thinking-dot" />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary thinking-dot" />
                            <div className="w-1.5 h-1.5 rounded-full bg-primary thinking-dot" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && !searchMutation.isPending && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="py-20 container mx-auto px-4 sm:px-6 bg-background relative z-10" 
              data-testid="section-results"
            >
              {/* Results Header */}
              <motion.div 
                className="mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <motion.div 
                      className="flex items-center gap-2 text-sm font-medium text-primary mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isPersonalized ? (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Based on your preferences</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>AI-powered results</span>
                        </>
                      )}
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
                      {currentQueryLabel ? (
                        <>"{currentQueryLabel}"</>
                      ) : (
                        "Recommended for you"
                      )}
                    </h2>
                    <p className="text-muted-foreground mt-2 font-light">
                      Found {displayResults.length} vehicles matching your criteria {locationLabel && `near ${locationLabel}`}
                    </p>
                  </div>
                  
                  {hasSearched && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground hover:text-primary-foreground hover:bg-primary rounded-full border border-border hover:border-primary transition-all duration-300 shadow-sm"
                    >
                      <ArrowUp className="w-4 h-4" />
                      New search
                    </motion.button>
                  )}
                </div>
              </motion.div>
              
              {/* Results Grid with stagger animation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {displayResults.map((car: CarResult, index: number) => (
                  <CarCard key={car.id || `car-${index}`} car={car} index={index} />
                ))}
              </div>

              {/* CTA Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-20 p-10 bg-card/50 backdrop-blur-sm rounded-3xl border border-border text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    Not quite right?
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8 font-light">
                    Our AI learns from your feedback. Try a more specific search or chat with our assistant.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
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
                      variant="default"
                      className="h-12 px-8 rounded-full font-medium"
                    >
                      New Search
                    </Button>
                    {chatEnabled && (
                      <Button 
                        onClick={() => setAssistantOpen(true)}
                        variant="outline"
                        className="h-12 px-8 rounded-full font-medium bg-transparent border-border hover:bg-secondary hover:text-foreground"
                      >
                        Chat with AI
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Landing Page Content (shown when no search active) */}
        {!showResults && !searchMutation.isPending && !hasSearched && (
          <LandingContent />
        )}

        {/* No Results State */}
        {hasSearched && !searchMutation.isPending && results.length === 0 && (
          <section className="py-32 container mx-auto px-4 sm:px-6 bg-background">
            <motion.div 
              className="text-center max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-20 h-20 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">No matches found</h2>
              <p className="text-muted-foreground mb-8 font-light leading-relaxed">
                We couldn't find any cars matching your exact criteria. Try adjusting your filters or use broader keywords.
              </p>
              <Button
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
                size="lg"
                className="rounded-full px-8"
              >
                Try another search
              </Button>
            </motion.div>
          </section>
        )}
        
        {/* Footer */}
        <footer className="border-t border-border py-16 px-6 bg-background/50 backdrop-blur-lg">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <Logo />
              </div>
              
              <div className="flex items-center gap-8 text-sm text-muted-foreground font-medium">
                <a href="/pricing" className="hover:text-primary transition-colors">Pricing</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
              </div>
              
              <p className="text-sm text-muted-foreground/60">
                © 2025 SearchAuto Inc.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
