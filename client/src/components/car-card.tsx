import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Fuel, Calendar, Gauge, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { CarResult } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface CarCardProps {
  car: CarResult;
  index?: number;
}

export function CarCard({ car, index = 0 }: CarCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = car.images?.filter(img => 
    img && !img.includes('.svg') && !img.includes('placeholder')
  ) || [];
  const hasMultipleImages = images.length > 1;

  const getDealerSearchUrl = () => {
    if (car.sourceUrl) return car.sourceUrl;
    const dealerName = car.dealerName || car.dealership || "car dealership";
    const location = car.location || "";
    const searchQuery = encodeURIComponent(`${dealerName} ${location}`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const matchScore = car.match || 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group bg-[#0c0c0f] border border-white/10 rounded-2xl overflow-hidden hover:border-[#cffe25]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#1a1a1d]">
        {images.length > 0 ? (
          <>
            <motion.img
              key={imageIndex}
              src={images[imageIndex]}
              alt={`${car.brand} ${car.model}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ 
                opacity: 1, 
                scale: isHovered ? 1.05 : 1 
              }}
              transition={{ duration: 0.4 }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-transparent to-transparent opacity-80" />
            
            {/* Image navigation */}
            {hasMultipleImages && (
              <>
                <motion.button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white border border-white/10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                  whileHover={{ scale: 1.1, backgroundColor: "#cffe25", color: "black", borderColor: "#cffe25" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                <motion.button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white border border-white/10"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
                  whileHover={{ scale: 1.1, backgroundColor: "#cffe25", color: "black", borderColor: "#cffe25" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
                
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.slice(0, 5).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageIndex(i); }}
                      className={`h-1 rounded-full transition-all ${
                        i === imageIndex 
                          ? 'w-5 bg-[#cffe25]' 
                          : 'w-1 bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-[#757b83]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
        
        {/* Match badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#cffe25] text-black text-xs font-bold shadow-lg tracking-wide">
          {matchScore}% MATCH
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Price */}
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-white font-display text-lg leading-tight truncate pr-2">
              {car.year} {car.brand} {car.model}
            </h3>
            <p className="text-xl font-bold text-[#cffe25] font-display whitespace-nowrap">{car.price}</p>
          </div>
          {(car.dealerName || car.dealership) && (
            <p className="text-xs text-[#757b83] truncate">
              {car.dealerName || car.dealership}
            </p>
          )}
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {car.mileage && (
            <div className="flex items-center gap-2 text-xs text-[#757b83] bg-[#1a1a1d] p-2 rounded-lg border border-white/5">
              <Gauge className="w-3.5 h-3.5 text-[#cffe25]" />
              <span className="truncate text-white">{car.mileage}</span>
            </div>
          )}
          {car.fuelType && (
            <div className="flex items-center gap-2 text-xs text-[#757b83] bg-[#1a1a1d] p-2 rounded-lg border border-white/5">
              <Fuel className="w-3.5 h-3.5 text-[#cffe25]" />
              <span className="truncate text-white">{car.fuelType}</span>
            </div>
          )}
          {car.year && (
            <div className="flex items-center gap-2 text-xs text-[#757b83] bg-[#1a1a1d] p-2 rounded-lg border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-[#cffe25]" />
              <span className="text-white">{car.year}</span>
            </div>
          )}
          {car.location && (
            <div className="flex items-center gap-2 text-xs text-[#757b83] bg-[#1a1a1d] p-2 rounded-lg border border-white/5">
              <MapPin className="w-3.5 h-3.5 text-[#cffe25]" />
              <span className="truncate text-white">{car.location}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {car.features && car.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 h-6 overflow-hidden">
            {car.features.slice(0, 3).map((feature, i) => (
              <span 
                key={i} 
                className="px-2 py-0.5 text-[10px] bg-white/5 text-white/80 rounded border border-white/10"
              >
                {feature}
              </span>
            ))}
            {car.features.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] text-[#cffe25] font-medium">
                +{car.features.length - 3}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <a
          href={getDealerSearchUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <Button className="w-full group bg-white text-black hover:bg-[#cffe25] hover:text-black font-bold rounded-xl transition-all duration-300">
            <span>View Details</span>
            <ExternalLink className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </a>
      </div>
    </motion.div>
  );
}