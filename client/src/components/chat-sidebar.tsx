import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Loader2, Bot, User, Maximize2, Minimize2 } from "lucide-react";
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
              fixed bottom-6 right-6 z-50 
              w-14 h-14 rounded-full
              bg-primary text-primary-foreground
              flex items-center justify-center
              shadow-2xl shadow-primary/20
              border border-primary/20
              transition-all duration-200
              ${highlight ? "animate-pulse" : ""}
            `}
            data-testid="button-open-chat"
          >
            <MessageCircle className="w-6 h-6" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center border border-background">
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
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`
              fixed top-0 right-0 z-50 h-full
              ${isExpanded ? "w-full lg:w-[600px]" : "w-full sm:w-[450px]"}
              bg-background/95 backdrop-blur-xl border-l border-border
              flex flex-col shadow-2xl
            `}
            data-testid="chat-sidebar"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground font-display">AI Assistant</h2>
                  <p className="text-xs text-muted-foreground">Powered by SearchAuto Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden lg:flex p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  data-testid="button-close-chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center mb-6">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2 font-display">How can I help?</h3>
                  <p className="text-sm text-muted-foreground max-w-[280px] mb-8">
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
                        className="w-full px-4 py-3 text-sm text-left text-muted-foreground hover:text-foreground bg-secondary/30 hover:bg-secondary/60 rounded-xl border border-border hover:border-primary/30 transition-all"
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
                        w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center border
                        ${message.role === "user" 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-secondary text-foreground border-border"
                        }
                      `}>
                        {message.role === "user" 
                          ? <User className="w-4 h-4" />
                          : <Bot className="w-4 h-4" />
                        }
                      </div>
                      <div className={`
                        max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                        ${message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 border border-border text-foreground"
                        }
                      `}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {sendMutation.isPending && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border">
                        <Bot className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="bg-secondary/30 border border-border rounded-2xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-border bg-background/50 backdrop-blur-sm">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything..."
                  disabled={sendMutation.isPending}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                  data-testid="input-chat"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  size="icon"
                  className="rounded-xl w-12 h-12"
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

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
