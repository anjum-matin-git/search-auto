import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { CarResult } from "@/lib/api";

interface CarCardProps {
  car: CarResult;
  index: number;
}

export function CarCard({ car, index }: CarCardProps) {
  const imageUrl = car.images?.[0] || "https://images.unsplash.com/photo-1555215695-3004980adade?w=800";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 hover:-translate-y-1"
      data-testid={`card-car-${car.id}`}
    >
      <div className="aspect-[4/3] overflow-hidden relative bg-secondary">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={imageUrl}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
          data-testid={`img-car-${car.id}`}
        />
        
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-foreground shadow-sm" data-testid={`badge-match-${car.id}`}>
          {car.match || 95}% Match
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-sm text-muted-foreground font-medium mb-1" data-testid={`text-brand-${car.id}`}>{car.brand}</h3>
            <h2 className="text-2xl font-display font-semibold text-foreground leading-tight" data-testid={`text-model-${car.id}`}>
              {car.model}
            </h2>
            {car.year && (
              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-year-${car.id}`}>{car.year}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-foreground" data-testid={`text-price-${car.id}`}>{car.price}</p>
            {car.mileage && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-mileage-${car.id}`}>{car.mileage}</p>
            )}
          </div>
        </div>

        {car.specs && (
          <div className="flex justify-between items-center py-6 border-t border-gray-100 mb-6">
            {car.specs.acceleration && (
              <div className="text-center px-2">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">0-60</div>
                <div className="font-semibold text-foreground" data-testid={`spec-acceleration-${car.id}`}>{car.specs.acceleration}</div>
              </div>
            )}
            {car.specs.topSpeed && (
              <>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="text-center px-2">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Top Speed</div>
                  <div className="font-semibold text-foreground" data-testid={`spec-topspeed-${car.id}`}>{car.specs.topSpeed}</div>
                </div>
              </>
            )}
            {car.specs.power && (
              <>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="text-center px-2">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Power</div>
                  <div className="font-semibold text-foreground" data-testid={`spec-power-${car.id}`}>{car.specs.power}</div>
                </div>
              </>
            )}
          </div>
        )}

        {car.location && (
          <p className="text-sm text-muted-foreground mb-4" data-testid={`text-location-${car.id}`}>📍 {car.location}</p>
        )}

        <a 
          href={car.sourceUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-secondary hover:bg-foreground hover:text-white text-foreground rounded-2xl transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 group/btn" 
          data-testid={`button-details-${car.id}`}
        >
          View Details <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </a>
      </div>
    </motion.div>
  );
}