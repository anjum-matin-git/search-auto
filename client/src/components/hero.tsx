import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Loader2, ArrowRight, Zap, Car, Brain } from "lucide-react";

interface HeroProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

export function Hero({ onSearch, isSearching }: HeroProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const suggestions = [
    { text: "Electric SUV under $60k", icon: Zap },
    { text: "Luxury sedan with autopilot", icon: Car },
    { text: "Fast sports car", icon: Brain },
  ];

  return (
    <section className="relative min-h-[85vh] w-full flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-4 sm:px-6">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="orb orb-primary w-[500px] h-[500px] -top-20 -left-20"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="orb orb-accent w-[400px] h-[400px] top-1/3 -right-20"
          animate={{ 
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="orb orb-purple w-[300px] h-[300px] bottom-20 left-1/4"
          animate={{ 
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-40" />
      </div>

      <div className="relative z-10 container mx-auto flex flex-col items-center text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full"
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium mb-8 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-600">AI-Powered Search</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </motion.div>
          
          {/* Headline */}
          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-balance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-gray-900">Find your </span>
            <span className="gradient-text">perfect car</span>
            <br />
            <span className="text-gray-900">in seconds</span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            className="text-gray-500 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Describe what you're looking for in plain English. Our AI searches thousands of listings and finds the best matches for you.
          </motion.p>

          {/* Search Box */}
          <motion.div 
            className="w-full max-w-2xl mx-auto relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={`
              relative flex flex-col sm:flex-row sm:items-center gap-3 
              bg-white rounded-2xl p-3 sm:p-4
              border-2 transition-all duration-300
              ${isFocused 
                ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' 
                : 'border-gray-200 shadow-md hover:shadow-lg hover:border-gray-300'
              }
            `}>
              <div className="flex items-center gap-3 flex-1">
                <div className={`
                  hidden sm:flex items-center justify-center w-10 h-10 rounded-xl transition-colors
                  ${isFocused ? 'bg-indigo-100' : 'bg-gray-100'}
                `}>
                  <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                <input 
                  type="text"
                  placeholder="Describe your dream car..."
                  className="flex-1 bg-transparent border-none text-gray-900 placeholder:text-gray-400 px-1 py-2 text-base sm:text-lg font-medium outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isSearching}
                  data-testid="input-search"
                />
              </div>
              <motion.button 
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}
                className={`
                  w-full sm:w-auto px-6 py-3 rounded-xl font-semibold 
                  flex items-center justify-center gap-2 
                  transition-all duration-200
                  ${isSearching || !searchTerm.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg pressable'
                  }
                `}
                whileTap={{ scale: 0.98 }}
                data-testid="button-search"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Search</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
            
            {/* Keyboard hint */}
            <div className="hidden sm:flex items-center justify-center gap-2 mt-3 text-sm text-gray-400">
              <span>Press</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-500 border border-gray-200">Enter</kbd>
              <span>to search</span>
            </div>
          </motion.div>

          {/* Suggestion chips */}
          <motion.div 
            className="flex flex-wrap gap-2 justify-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-sm text-gray-400 mr-2">Try:</span>
            {suggestions.map((suggestion, i) => {
              const Icon = suggestion.icon;
              return (
                <motion.button
                  key={suggestion.text}
                  onClick={() => setSearchTerm(suggestion.text)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all pressable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-500" />
                  {suggestion.text}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Real-time listings</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>AI-powered matching</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Verified dealers</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
