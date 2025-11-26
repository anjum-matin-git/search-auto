import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Logo } from "@/components/logo";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0c0c0f] border border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <Logo showText={false} iconClassName="w-16 h-16 text-[#cffe25]" />
          </div>
          <DialogTitle className="text-center text-2xl font-display font-bold text-white">Sign in to SearchAuto</DialogTitle>
          <DialogDescription className="text-center text-[#757b83]">
            Create a free account to unlock AI-powered car search
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-6">
          <Link href="/signup">
            <button 
              className="w-full px-6 py-3.5 bg-[#cffe25] text-black rounded-xl hover:bg-[#e2ff5e] hover:shadow-[0_0_20px_rgba(207,254,37,0.3)] transition-all font-bold tracking-wide"
              data-testid="modal-signup"
            >
              Create Account
            </button>
          </Link>
          <Link href="/login">
            <button 
              className="w-full px-6 py-3.5 border border-white/10 bg-white/5 rounded-xl hover:bg-white/10 transition-all font-medium text-white"
              data-testid="modal-login"
            >
              Log In
            </button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}