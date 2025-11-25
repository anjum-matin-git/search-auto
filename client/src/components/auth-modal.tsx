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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-6">
            <Logo showText={false} iconClassName="w-16 h-16" />
          </div>
          <DialogTitle className="text-center text-2xl font-display font-bold">Sign in to search</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Create a free account to unlock AI-powered car search
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Link href="/signup">
            <button 
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold"
              data-testid="modal-signup"
            >
              Create Account
            </button>
          </Link>
          <Link href="/login">
            <button 
              className="w-full px-6 py-3 border border-border rounded-xl hover:bg-secondary/50 transition-all font-medium text-foreground"
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
