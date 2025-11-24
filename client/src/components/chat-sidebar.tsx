import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversation, sendAssistantMessage } from "@/lib/assistant-api";
import { getStoredUser } from "@/lib/auth-api";
import { MessageSquare, Loader2, Send, LockKeyhole, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      <button
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-white text-black px-5 py-3 shadow-2xl shadow-black/40 pressable",
          !user && "bg-white/70 text-black/70"
        )}
        onClick={() => {
          if (!user) {
            toast.info("Log in to chat with the concierge.");
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
      </button>
      
      {user && (
        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-white/10 bg-[#050014]/95 text-white shadow-[0_25px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl transition-transform duration-300",
            open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
          )}
        >
          <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-black/50">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Concierge Agent</p>
                <p className="text-xs text-white/60">Ask anything about your search</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-white/60 hover:text-white transition rounded-full hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4" ref={containerRef}>
            {conversationQuery.isLoading ? (
              <div className="flex items-center justify-center text-white/60 h-full">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading assistant...
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md",
                      msg.role === "user"
                        ? "bg-white text-black rounded-tr-none"
                        : "bg-white/10 text-white rounded-tl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <footer className="border-t border-white/10 p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe what you need..."
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                disabled={sendMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={sendMutation.isPending || !message.trim()}
                className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-black/40 disabled:opacity-50 pressable"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              className="mt-4 text-xs uppercase tracking-[0.3em] text-white/50 hover:text-white transition pressable px-4 py-2 rounded-full border border-white/10"
              onClick={() => onOpenChange(false)}
            >
              Hide Chat
            </button>
          </footer>
        </aside>
      )}
    </>
  );
}

