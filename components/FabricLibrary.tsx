
import React, { useRef } from 'react';
import { FABRICS } from '../constants';

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface FabricLibraryProps {
  onSelectFabric: (prompt: string, name: string) => void;
  isActionable: boolean;
  targetGarment: string;
  setTargetGarment: (value: string) => void;
}

export const FabricLibrary: React.FC<FabricLibraryProps> = ({ onSelectFabric, isActionable, targetGarment, setTargetGarment }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const areSwatchesDisabled = !isActionable || !targetGarment;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-purple-300">Fabric Library</h2>
      
      <div className="mb-4">
        <label htmlFor="target-garment" className="block text-sm font-medium text-gray-300 mb-1">
          Target Garment
        </label>
        <input
          type="text"
          id="target-garment"
          value={targetGarment}
          onChange={(e) => setTargetGarment(e.target.value)}
          className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
          placeholder="e.g., shirt, pants, matching top and skirt"
          disabled={!isActionable}
        />
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-gray-700/50 hover:bg-gray-600/80 rounded-full p-1 text-white transition-colors"
          aria-label="Scroll left"
        >
          <ArrowIcon className="h-6 w-6 transform rotate-180" />
        </button>
        <div
          ref={scrollContainerRef}
          className="grid grid-rows-3 grid-flow-col gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
        >
          {FABRICS.map((fabric) => (
            <button
              key={fabric.id}
              onClick={() => onSelectFabric(fabric.prompt, fabric.name)}
              disabled={areSwatchesDisabled}
              className="w-24 h-24 flex-shrink-0 group relative rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:cursor-not-allowed"
              title={`Apply ${fabric.name}`}
            >
              <img
                src={fabric.imageUrl}
                alt={fabric.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-end justify-center p-1">
                <p className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center">{fabric.name}</p>
              </div>
               {areSwatchesDisabled && <div className="absolute inset-0 bg-gray-800 bg-opacity-50"></div>}
            </button>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-gray-700/50 hover:bg-gray-600/80 rounded-full p-1 text-white transition-colors"
          aria-label="Scroll right"
        >
          <ArrowIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};