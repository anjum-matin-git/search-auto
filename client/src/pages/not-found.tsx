import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(220_13%_5%)] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 Number */}
        <motion.div 
          className="text-[120px] sm:text-[160px] font-bold leading-none gradient-text mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          404
        </motion.div>
        
        <motion.h1 
          className="text-2xl font-semibold text-white mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Page not found
        </motion.h1>
        
        <motion.p 
          className="text-[hsl(220_10%_50%)] mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/">
            <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 linear-button rounded-lg text-sm font-medium pressable">
              <Home className="w-4 h-4" />
              Go home
            </button>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 linear-button-secondary rounded-lg text-sm font-medium pressable"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
