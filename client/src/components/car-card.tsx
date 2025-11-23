import { motion } from "framer-motion";
import { Car } from "@/lib/mock-data";
import { ArrowRight, Gauge, Zap, Timer } from "lucide-react";

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
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-1"
    >
      {/* Image Section */}
      <div className="aspect-[4/3] overflow-hidden relative bg-secondary">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
        />
        
        {/* Match Score Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-foreground shadow-sm">
          {car.match}% Match
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-sm text-muted-foreground font-medium mb-1">{car.brand}</h3>
            <h2 className="text-2xl font-display font-semibold text-foreground leading-tight">
              {car.model}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground">{car.price}</p>
          </div>
        </div>

        {/* Specs Grid - Cleaner */}
        <div className="flex justify-between items-center py-6 border-t border-gray-100 mb-6">
          <div className="text-center px-2">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">0-60</div>
            <div className="font-semibold text-foreground">{car.specs.acceleration}</div>
          </div>
          <div className="w-px h-8 bg-gray-100"></div>
          <div className="text-center px-2">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Top Speed</div>
            <div className="font-semibold text-foreground">{car.specs.topSpeed}</div>
          </div>
          <div className="w-px h-8 bg-gray-100"></div>
          <div className="text-center px-2">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Power</div>
            <div className="font-semibold text-foreground">{car.specs.power}</div>
          </div>
        </div>

        <button className="w-full py-4 bg-secondary hover:bg-foreground hover:text-white text-foreground rounded-2xl transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 group/btn">
          View Details <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}