import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Sparkles } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Sign in to search</DialogTitle>
          <DialogDescription className="text-center">
            Create a free account to unlock AI-powered car search
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Link href="/signup">
            <button 
              className="w-full px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 hover:shadow-lg hover:shadow-black/20 transition-all font-semibold"
              data-testid="modal-signup"
            >
              Create Account
            </button>
          </Link>
          <Link href="/login">
            <button 
              className="w-full px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
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
