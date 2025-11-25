import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversation, sendAssistantMessage } from "@/lib/assistant-api";
import { getStoredUser } from "@/lib/auth-api";
import { MessageSquare, Loader2, Send, LockKeyhole, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequireAuth?: () => void;
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
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const conversationQuery = useQuery({
    queryKey: ["assistant-conversation"],
    queryFn: getConversation,
    enabled: !!user && open,
    staleTime: 1000 * 60 * 5,
  });
  
  const sendMutation = useMutation({
    mutationFn: sendAssistantMessage,
    onSuccess: (data) => {
      queryClient.setQueryData(["assistant-conversation"], data);
      setMessage("");
      scrollToBottom();
      const normalizedIntent = data.nextSearchQuery?.trim();
      if (normalizedIntent) {
        onSearchIntent?.(normalizedIntent);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Assistant is unavailable. Please try again.");
    },
  });
  
  const messages = useMemo(
    () => conversationQuery.data?.messages ?? [],
    [conversationQuery.data]
  );
  
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };
  
  useEffect(() => {
    if ((!user || !visible) && open) {
      onOpenChange(false);
    }
  }, [user, open, onOpenChange, visible]);
  
  useEffect(() => {
    if (open && messages.length) {
      scrollToBottom();
    }
  }, [messages, open]);
  
  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };
  
  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg transition-all",
          user 
            ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl" 
            : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
        )}
        onClick={() => {
          if (!user) {
            toast.info("Log in to chat with the AI assistant.");
            onRequireAuth?.();
            return;
          }
          onOpenChange(true);
        }}
      >
        <span className="relative flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="w-4 h-4" />
          Chat
          {highlight && (
            <span className="absolute -top-1 -right-2 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400"></span>
            </span>
          )}
        </span>
        {!user && <LockKeyhole className="w-4 h-4" />}
      </motion.button>
      
      {/* Chat Panel */}
      <AnimatePresence>
        {user && open && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-gray-200 shadow-2xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">AI Assistant</p>
                  <p className="text-xs text-gray-500">Ask me anything about cars</p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition rounded-lg hover:bg-gray-100"
                aria-label="Close assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4" ref={containerRef}>
              {conversationQuery.isLoading ? (
                <div className="flex items-center justify-center text-gray-400 h-full">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Start a conversation</h3>
                  <p className="text-sm text-gray-500">
                    Ask about specific cars, get recommendations, or refine your search
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      )}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))
              )}
              
              {sendMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Input */}
            <footer className="border-t border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about cars..."
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  disabled={sendMutation.isPending}
                />
                <button
                  onClick={handleSend}
                  disabled={sendMutation.isPending || !message.trim()}
                  className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all pressable"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </footer>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
