import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Building2, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { CarResult } from "@/lib/api";

interface CarCardProps {
  car: CarResult;
  index: number;
}

export function CarCard({ car, index }: CarCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const images = car.images?.length ? car.images : ["https://images.unsplash.com/photo-1555215695-3004980adade?w=800"];
  const imageUrl = images[currentImageIndex];
  
  const getDealerSearchUrl = () => {
    if (car.sourceUrl) return car.sourceUrl;
    if (car.url) return car.url;
    const dealerName = car.dealerName || car.dealership || "car dealership";
    const location = car.location || "";
    const searchQuery = encodeURIComponent(`${dealerName} ${location}`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const matchScore = car.match || 95;
  const matchColor = matchScore >= 90 ? 'text-green-600 bg-green-50 border-green-200' 
                   : matchScore >= 70 ? 'text-amber-600 bg-amber-50 border-amber-200'
                   : 'text-gray-600 bg-gray-50 border-gray-200';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 card-hover"
      data-testid={`card-car-${car.id}`}
    >
      {/* Image Section */}
      <div className="aspect-[4/3] overflow-hidden relative bg-gray-100">
        <motion.img
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={imageUrl}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          data-testid={`img-car-${car.id}`}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Image navigation */}
        {images.length > 1 && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}
        
        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentImageIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Match badge */}
        <div 
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold border ${matchColor}`}
          data-testid={`badge-match-${car.id}`}
        >
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {matchScore}% Match
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1" data-testid={`text-brand-${car.id}`}>
              {car.brand}
            </p>
            <h3 className="text-lg font-bold text-gray-900 truncate" data-testid={`text-model-${car.id}`}>
              {car.model}
            </h3>
            {car.year && (
              <p className="text-sm text-gray-500 mt-0.5" data-testid={`text-year-${car.id}`}>{car.year}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-bold text-gray-900" data-testid={`text-price-${car.id}`}>
              {car.price}
            </p>
            {car.mileage && (
              <p className="text-xs text-gray-500 mt-0.5" data-testid={`text-mileage-${car.id}`}>{car.mileage}</p>
            )}
          </div>
        </div>

        {/* Location */}
        {car.location && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4" data-testid={`text-location-${car.id}`}>
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{car.location}</span>
          </div>
        )}

        {/* Dealer info */}
        {car.dealerName && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100" data-testid={`dealer-name-${car.id}`}>
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="truncate">{car.dealerName}</span>
          </div>
        )}

        {/* Features */}
        {car.features && car.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {car.features.slice(0, 3).map((feature, i) => (
              <span 
                key={i}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                {feature}
              </span>
            ))}
            {car.features.length > 3 && (
              <span className="px-2 py-1 text-gray-400 text-xs">
                +{car.features.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* CTA Button */}
        <a 
          href={getDealerSearchUrl()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 group/btn pressable" 
          data-testid={`button-details-${car.id}`}
        >
          Find Dealer 
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
        </a>
      </div>
    </motion.div>
  );
}
