import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Sparkles, Crown, Check } from "lucide-react";
import { Logo } from "@/components/logo";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  creditsRemaining: number;
}

export function PaywallModal({ open, onClose, creditsRemaining }: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#0c0c0f] border border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <Logo showText={false} iconClassName="w-20 h-20 text-[#cffe25]" />
          </div>
          <DialogTitle className="text-center text-3xl font-display font-bold text-white">
            {creditsRemaining === 0 ? "Out of Credits" : "Upgrade Your Search"}
          </DialogTitle>
          <DialogDescription className="text-center text-base text-[#757b83] mt-2">
            {creditsRemaining === 0
              ? "You've used all your free searches. Upgrade to continue finding your perfect car."
              : `You have ${creditsRemaining} searches left. Upgrade for unlimited access and premium features.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-8">
          <Link href="/pricing">
            <button className="w-full group relative px-6 py-5 bg-[#cffe25] text-black rounded-2xl hover:bg-[#d8f7d6] hover:shadow-[0_0_30px_rgba(207,254,37,0.3)] transition-all font-bold flex items-center justify-between overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                <div className="bg-black/10 p-1.5 rounded-lg">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm uppercase tracking-wide opacity-80">Dealer Pro</div>
                  <div className="text-lg leading-none">Unlimited Access</div>
                </div>
              </span>
              <span className="relative z-10 text-xl font-display">$29<span className="text-sm font-normal opacity-70">/mo</span></span>
            </button>
          </Link>

          <Link href="/pricing">
            <button className="w-full px-6 py-4 border border-white/10 bg-white/5 rounded-2xl hover:bg-white/10 transition-all font-medium flex items-center justify-between text-white group">
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#757b83] group-hover:text-white transition-colors" />
                Personal - 50 Credits
              </span>
              <span className="text-[#757b83] group-hover:text-white transition-colors">$5</span>
            </button>
          </Link>
        </div>

        <div className="flex justify-center gap-6 mt-8 text-xs text-[#757b83]">
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-[#cffe25]" /> Cancel anytime
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-[#cffe25]" /> Secure payment
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}