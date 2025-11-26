import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Loader2, Bot, User, Maximize2, Minimize2, Sparkles, ChevronDown } from "lucide-react";
import { getStoredUser } from "@/lib/auth-api";
import { getConversation, sendAssistantMessage, type AssistantMessage as Message } from "@/lib/assistant-api";
import { Button } from "@/components/ui/button";

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequireAuth: () => void;
  highlight?: boolean;
  onSearchIntent?: (query: string) => void;
  visible?: boolean;
}

export function ChatSidebar({
  open,
  onOpenChange,
  onRequireAuth,
  highlight = false,
  onSearchIntent,
  visible = true,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const user = getStoredUser();
  const queryClient = useQueryClient();

  const conversationQuery = useQuery({
    queryKey: ["assistant-conversation"],
    queryFn: getConversation,
    enabled: !!user && open,
    refetchInterval: open ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => sendAssistantMessage(message),
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ["assistant-conversation"] });
      const previous = queryClient.getQueryData(["assistant-conversation"]);
      
      queryClient.setQueryData(["assistant-conversation"], (old: any) => ({
        ...old,
        messages: [
          ...(old?.messages || []),
          { id: Date.now(), role: "user", content: newMessage, createdAt: new Date().toISOString() },
        ],
      }));
      return { previous };
    },
    onError: (err, newMessage, context) => {
      queryClient.setQueryData(["assistant-conversation"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assistant-conversation"] });
    },
    onSuccess: (response) => {
      if (onSearchIntent && response?.nextSearchQuery) {
        onSearchIntent(response.nextSearchQuery);
      }
    },
  });

  const messages = conversationQuery.data?.messages || [];

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages.length]);

  // Handle ESC key to close chat
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscKey);
      return () => document.removeEventListener("keydown", handleEscKey);
    }
  }, [open, onOpenChange]);

  const handleSend = () => {
    if (!input.trim()) return;
    if (!user) {
      onRequireAuth();
      return;
    }
    sendMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenChange(true)}
            className={`
              fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 
              w-12 h-12 sm:w-14 sm:h-14 rounded-full
              bg-[#cffe25] text-black
              flex items-center justify-center
              shadow-[0_0_30px_rgba(207,254,37,0.3)]
              border border-[#cffe25]
              transition-all duration-200
              ${highlight ? "animate-pulse" : ""}
            `}
            data-testid="button-open-chat"
          >
            <MessageCircle className="w-6 h-6" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border border-black">
                {messages.length > 9 ? '9+' : messages.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
              fixed z-[100]
              inset-x-0 bottom-0 top-20 sm:top-0 sm:left-auto sm:right-0 sm:bottom-0 sm:h-auto
              ${isExpanded ? "sm:w-[600px]" : "sm:w-[400px] md:w-[450px]"}
              bg-[#010104]/95 backdrop-blur-2xl 
              border-t sm:border-t-0 sm:border-l border-white/10
              flex flex-col shadow-2xl
              safe-area-inset rounded-t-[2rem] sm:rounded-none
            `}
            data-testid="chat-sidebar"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pt-4 sm:pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-white/10 bg-[#010104]/80 backdrop-blur-sm rounded-t-[2rem] sm:rounded-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1a1a1d] flex items-center justify-center border border-white/10 flex-shrink-0 overflow-hidden relative">
                  <motion.svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="w-4 h-4 sm:w-5 sm:h-5 text-[#cffe25] absolute"
                    animate={{ 
                      x: [-10, 10],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.5
                    }}
                  >
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </motion.svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white font-display truncate">SearchAuto AI</h2>
                  <p className="text-xs text-[#757b83] truncate hidden sm:block">Concierge & Search Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden lg:flex p-2 hover:bg-[#1a1a1d] rounded-lg transition-colors text-[#757b83] hover:text-white"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenChange(false);
                  }}
                  className="p-2.5 sm:p-2 hover:bg-[#1a1a1d] rounded-lg transition-colors text-white hover:text-red-400 hover:bg-red-500/10 flex items-center gap-2 z-[101] relative"
                  title="Close chat (ESC)"
                  data-testid="button-close-chat"
                  aria-label="Close chat"
                >
                  <span className="text-xs font-medium sm:hidden">Close</span>
                  <X className="w-5 h-5 sm:hidden" />
                  <X className="w-5 h-5 hidden sm:block" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 hide-scrollbar">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#1a1a1d] border border-white/5 flex items-center justify-center mb-6 overflow-hidden relative">
                    <motion.svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      className="w-8 h-8 text-[#757b83] absolute"
                      animate={{ 
                        x: [-12, 12],
                        opacity: [0, 1, 1, 0]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 0.5
                      }}
                    >
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </motion.svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2 font-display">How can I help?</h3>
                  <p className="text-sm text-[#757b83] max-w-[280px] mb-8">
                    Ask me anything about cars, financing, or refine your search criteria.
                  </p>
                  
                  <div className="space-y-3 w-full max-w-[320px]">
                    {[
                      "Show me electric SUVs under $50k",
                      "What's the best family car?",
                      "Compare Tesla Model 3 vs Y",
                    ].map((suggestion, i) => (
                      <motion.button
                        key={suggestion}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="w-full px-4 py-3 text-sm text-left text-[#757b83] hover:text-white bg-[#1a1a1d] hover:bg-[#252529] rounded-xl border border-white/10 hover:border-[#cffe25]/30 transition-all"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((message: Message, index: number) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border overflow-hidden
                        ${message.role === "user" 
                          ? "bg-[#cffe25] text-black border-[#cffe25]" 
                          : "bg-[#1a1a1d] text-white border-white/10"
                        }
                      `}>
                        {message.role === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <motion.svg 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            className="w-4 h-4 absolute"
                            animate={{ 
                              x: [-8, 8],
                              opacity: [0, 1, 1, 0]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              repeatDelay: 0.5
                            }}
                          >
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                            <circle cx="7" cy="17" r="2" />
                            <circle cx="17" cy="17" r="2" />
                          </motion.svg>
                        )}
                      </div>
                      <div className={`
                        max-w-[85%] sm:max-w-[80%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed
                        ${message.role === "user"
                          ? "bg-[#cffe25] text-black font-medium"
                          : "bg-[#1a1a1d] border border-white/10 text-[#d1d1d1]"
                        }
                      `}>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {sendMutation.isPending && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#1a1a1d] flex items-center justify-center border border-white/10 overflow-hidden relative">
                        <motion.svg 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          className="w-4 h-4 text-white absolute"
                          animate={{ 
                            x: [-8, 8],
                            opacity: [0, 1, 1, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 0.5
                          }}
                        >
                          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                          <circle cx="7" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                        </motion.svg>
                      </div>
                      <div className="bg-[#1a1a1d] border border-white/10 rounded-2xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#cffe25] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#cffe25] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#cffe25] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#010104]/80 backdrop-blur-sm">
              <div className="flex gap-2 sm:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask SearchAuto AI..."
                  disabled={sendMutation.isPending}
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#1a1a1d] border border-white/10 text-white placeholder:text-[#757b83] text-base sm:text-sm outline-none focus:border-[#cffe25]/50 focus:ring-1 focus:ring-[#cffe25]/50 transition-all disabled:opacity-50 caret-[#cffe25]"
                  data-testid="input-chat"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  size="icon"
                  className="rounded-xl w-12 h-12 flex-shrink-0 bg-[#cffe25] text-black hover:bg-[#d8f7d6]"
                  data-testid="button-send"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transparent Backdrop - Click to Close */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/20 z-[99] sm:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}