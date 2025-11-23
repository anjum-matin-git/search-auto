import { motion } from "framer-motion";
import { ArrowRight, Phone, MapPin, Store } from "lucide-react";
import type { CarResult } from "@/lib/api";

interface CarCardProps {
  car: CarResult;
  index: number;
}

export function CarCard({ car, index }: CarCardProps) {
  const imageUrl = car.images?.[0] || "https://images.unsplash.com/photo-1555215695-3004980adade?w=800";
  
  const getDealerSearchUrl = () => {
    const dealerName = car.dealerName || car.dealership || "car dealership";
    const location = car.location || "";
    const searchQuery = encodeURIComponent(`${dealerName} ${location}`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden border border-purple-200/30 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/15 transition-all duration-500 hover:-translate-y-2"
      data-testid={`card-car-${car.id}`}
    >
      {/* Purple glow on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-10 blur transition duration-500" />
      <div className="aspect-[4/3] overflow-hidden relative bg-gradient-to-br from-gray-100 via-gray-50 to-white">
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
          src={imageUrl}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          data-testid={`img-car-${car.id}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-white shadow-2xl shadow-purple-500/50 border border-white/30" data-testid={`badge-match-${car.id}`}>
          {car.match || 95}% Match
        </div>
      </div>

      <div className="p-8 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider" data-testid={`text-brand-${car.id}`}>{car.brand}</h3>
            <h2 className="text-2xl font-display font-bold text-black leading-tight" data-testid={`text-model-${car.id}`}>
              {car.model}
            </h2>
            {car.year && (
              <p className="text-sm text-gray-600 mt-1 font-medium" data-testid={`text-year-${car.id}`}>{car.year}</p>
            )}
          </div>
          <div className="text-right bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-purple-500/40">
            <p className="text-lg font-black" data-testid={`text-price-${car.id}`}>{car.price}</p>
            {car.mileage && (
              <p className="text-xs text-purple-100 mt-0.5 font-semibold" data-testid={`text-mileage-${car.id}`}>{car.mileage}</p>
            )}
          </div>
        </div>

        {car.specs && (
          <div className="flex justify-between items-center py-6 border-y border-black/5 mb-6 bg-white/50">
            {car.specs.acceleration && (
              <div className="text-center px-2">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-bold">0-60</div>
                <div className="font-bold text-black text-sm" data-testid={`spec-acceleration-${car.id}`}>{car.specs.acceleration}</div>
              </div>
            )}
            {car.specs.topSpeed && (
              <>
                <div className="w-px h-8 bg-black/10"></div>
                <div className="text-center px-2">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-bold">Top Speed</div>
                  <div className="font-bold text-black text-sm" data-testid={`spec-topspeed-${car.id}`}>{car.specs.topSpeed}</div>
                </div>
              </>
            )}
            {car.specs.power && (
              <>
                <div className="w-px h-8 bg-black/10"></div>
                <div className="text-center px-2">
                  <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-widest font-bold">Power</div>
                  <div className="font-bold text-black text-sm" data-testid={`spec-power-${car.id}`}>{car.specs.power}</div>
                </div>
              </>
            )}
          </div>
        )}

        {car.location && (
          <p className="text-sm text-muted-foreground mb-4" data-testid={`text-location-${car.id}`}>📍 {car.location}</p>
        )}

        {(car.dealerName || car.dealerPhone || car.dealerAddress) && (
          <div className="mb-6 p-5 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white rounded-2xl border border-purple-500/20 shadow-xl shadow-purple-500/10" data-testid={`dealer-info-${car.id}`}>
            <h4 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-4">Dealer Information</h4>
            <div className="space-y-3">
              {car.dealerName && (
                <div className="flex items-start gap-3" data-testid={`dealer-name-${car.id}`}>
                  <Store className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white font-semibold">{car.dealerName}</span>
                </div>
              )}
              {car.dealerAddress && (
                <div className="flex items-start gap-3" data-testid={`dealer-address-${car.id}`}>
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-200">{car.dealerAddress}</span>
                </div>
              )}
              {car.dealerPhone && (
                <div className="flex items-start gap-3" data-testid={`dealer-phone-${car.id}`}>
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <a 
                    href={`tel:${car.dealerPhone}`} 
                    className="text-sm text-white hover:text-gray-300 transition-colors font-medium"
                  >
                    {car.dealerPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <a 
          href={getDealerSearchUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 text-white rounded-2xl transition-all duration-300 font-black text-sm flex items-center justify-center gap-2 group/btn shadow-xl shadow-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/60" 
          data-testid={`button-details-${car.id}`}
        >
          Find Dealer <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </a>
      </div>
    </motion.div>
  );
}