import { motion } from "framer-motion";
import { Car } from "@/lib/mock-data";
import { ArrowUpRight, Gauge, Zap, Timer } from "lucide-react";

interface CarCardProps {
  car: Car;
  index: number;
}

export function CarCard({ car, index }: CarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative bg-card border border-white/5 overflow-hidden hover:border-primary/50 transition-colors duration-500"
    >
      {/* Image Section */}
      <div className="aspect-[16/9] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
        />
        
        {/* Match Score Badge */}
        <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md border border-primary/30 px-3 py-1 text-xs font-mono text-primary">
          {car.match}% MATCH
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 relative z-20">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm text-muted-foreground font-mono mb-1">{car.brand}</h3>
            <h2 className="text-xl font-display font-bold text-white group-hover:text-primary transition-colors">
              {car.model}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{car.price}</p>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-white/5 mb-4">
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs flex items-center gap-1">
              <Timer className="w-3 h-3" /> 0-60
            </div>
            <span className="font-mono text-sm font-medium">{car.specs.acceleration}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs flex items-center gap-1">
              <Gauge className="w-3 h-3" /> Top
            </div>
            <span className="font-mono text-sm font-medium">{car.specs.topSpeed}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-muted-foreground text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" /> Power
            </div>
            <span className="font-mono text-sm font-medium">{car.specs.power}</span>
          </div>
        </div>

        <button className="w-full py-3 bg-white/5 hover:bg-primary hover:text-black border border-white/10 hover:border-primary transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 group-hover:tracking-wider">
          VIEW DETAILS <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}