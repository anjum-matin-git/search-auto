import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({ 
  className = "", 
  iconClassName = "w-8 h-8", 
  textClassName = "text-xl",
  showText = true
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full opacity-50" />
        
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={iconClassName}
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Top Aerodynamic Line */}
          <motion.path
            d="M6 14C6 14 14 12 20 12C28 12 34 18 34 18"
            stroke="url(#logoGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary"
            initial={{ pathLength: 0, opacity: 0, x: -5 }}
            animate={{ pathLength: 1, opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Bottom Chassis Line */}
          <motion.path
            d="M6 26C6 26 14 28 20 28C28 28 34 18 34 18"
            stroke="url(#logoGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary"
            initial={{ pathLength: 0, opacity: 0, x: -5 }}
            animate={{ pathLength: 1, opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />

          {/* Center Speed/AI Line */}
          <motion.path
            d="M12 20H28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          />

          {/* The "Eye" / AI Node */}
          <motion.circle
            cx="34"
            cy="18"
            r="3"
            fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.6 }}
          />
          
          {/* Orbiting particle */}
          <motion.circle
            cx="34"
            cy="18"
            r="5"
            stroke="currentColor"
            strokeWidth="1"
            className="text-primary/50"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold tracking-tight text-foreground ${textClassName}`}>
            SearchAuto
          </span>
          <span className="text-[0.65em] font-medium tracking-[0.2em] text-muted-foreground uppercase ml-0.5">
            AI Powered
          </span>
        </div>
      )}
    </div>
  );
}
