
import React from 'react';

interface RatingProps {
  value: number;
  max?: number;
  className?: string;
}

export default function Rating({ value, max = 5, className = '' }: RatingProps) {
  // Round to nearest half
  const roundedValue = Math.round(value * 2) / 2;
  
  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        
        // Full star
        if (starValue <= roundedValue) {
          return (
            <svg 
              key={i}
              className="w-4 h-4 text-yellow-400 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          );
        }
        
        // Half star
        if (starValue - 0.5 === roundedValue) {
          return (
            <svg 
              key={i}
              className="w-4 h-4 text-yellow-400 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
              <path 
                d="M12 17.27V2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" 
                className="text-yellow-400 fill-current"
              />
              <path 
                d="M12 17.27V2l2.81 6.63 7.19.61-5.46 4.73L18.18 21 12 17.27z" 
                className="text-gray-300 fill-current"
              />
            </svg>
          );
        }
        
        // Empty star
        return (
          <svg 
            key={i}
            className="w-4 h-4 text-gray-300 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      })}
    </div>
  );
}

