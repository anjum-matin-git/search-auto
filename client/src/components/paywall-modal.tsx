import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Sparkles, Crown, Zap } from "lucide-react";

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
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/20">
              <Zap className="w-8 h-8" />
            </div>
          </div>
          <DialogTitle className="text-center text-3xl">
            {creditsRemaining === 0 ? "Out of Credits" : "Upgrade Your Search"}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {creditsRemaining === 0
              ? "You've used all your free searches. Upgrade to continue finding your perfect car."
              : `You have ${creditsRemaining} searches left. Upgrade for unlimited access and premium features.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          <Link href="/pricing">
            <button className="w-full group relative px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-900 hover:shadow-xl hover:shadow-black/20 transition-all font-semibold flex items-center justify-between overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                <Crown className="w-5 h-5" />
                Go Pro - Unlimited Searches
              </span>
              <span className="relative z-10 text-gray-400">$25/mo</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </Link>

          <Link href="/pricing">
            <button className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all font-medium flex items-center justify-between">
              <span className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-gray-600" />
                Personal - 50 Credits
              </span>
              <span className="text-gray-600">$5</span>
            </button>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Cancel anytime. No long-term commitments.
        </p>
      </DialogContent>
    </Dialog>
  );
}
