import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Sparkles, Crown } from "lucide-react";
import { Logo } from "@/components/logo";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  creditsRemaining: number;
}

export function PaywallModal({ open, onClose, creditsRemaining }: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <Logo showText={false} iconClassName="w-20 h-20" />
          </div>
          <DialogTitle className="text-center text-3xl font-display font-bold">
            {creditsRemaining === 0 ? "Out of Credits" : "Upgrade Your Search"}
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground mt-2">
            {creditsRemaining === 0
              ? "You've used all your free searches. Upgrade to continue finding your perfect car."
              : `You have ${creditsRemaining} searches left. Upgrade for unlimited access and premium features.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          <Link href="/pricing">
            <button className="w-full group relative px-6 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 transition-all font-semibold flex items-center justify-between overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                <Crown className="w-5 h-5" />
                Go Pro - Unlimited Searches
              </span>
              <span className="relative z-10 opacity-90">$25/mo</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </Link>

          <Link href="/pricing">
            <button className="w-full px-6 py-4 border border-border rounded-xl hover:bg-secondary/50 transition-all font-medium flex items-center justify-between text-foreground">
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                Personal - 50 Credits
              </span>
              <span className="text-muted-foreground">$5</span>
            </button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Cancel anytime. No long-term commitments.
        </p>
      </DialogContent>
    </Dialog>
  );
}
