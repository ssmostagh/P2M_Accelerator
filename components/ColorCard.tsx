
import React, { useState } from 'react';
import { Loader } from './Loader.tsx';
import { RefreshIcon } from './icons.tsx';
import type { ColorPanelData, PanelLayout, PantoneColor } from '../types.ts';

// Note: API calls will be handled through backend

interface ColorCardProps {
  panelData: ColorPanelData;
  layout: PanelLayout;
}

export function ColorCard({ panelData, layout }: ColorCardProps) {
  const [currentColor, setCurrentColor] = useState<PantoneColor>(panelData.color);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse Pantone name to extract code and friendly name
  // Format: "PANTONE 17-1563 TCX Hot Coral" -> code: "PANTONE 17-1563 TCX", name: "Hot Coral"
  const parsePantoneName = (fullName: string): { code: string; displayName: string } => {
    const parts = fullName.split(' TCX ');
    if (parts.length === 2) {
      return {
        code: parts[0] + ' TCX',
        displayName: parts[1]
      };
    }
    // Fallback if format is different
    return {
      code: fullName,
      displayName: fullName
    };
  };

  const { code: pantoneCode, displayName } = parsePantoneName(currentColor.name);

  const handleRegenerate = async (e: React.MouseEvent, direction?: 'lighter' | 'darker' | 'warmer' | 'cooler') => {
    e.stopPropagation();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'regenerateColor',
          args: [currentColor.name, panelData.prompt, direction]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate color');
      }

      const newColor = await response.json();
      if (newColor.name && newColor.code && /^#[0-9A-F]{6}$/i.test(newColor.code)) {
        setCurrentColor(newColor);
      } else {
        throw new Error("Invalid color was generated.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error("Color regeneration failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`group relative rounded-lg overflow-visible shadow-lg transition-all duration-300 ease-in-out flex flex-col justify-end p-2 ${layout.gridClass}`}
      style={{ backgroundColor: currentColor.code }}
      aria-label={`Color swatch: ${currentColor.name}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 rounded-lg">
          <Loader />
        </div>
      )}
      {error && !isLoading && (
         <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-1 text-center z-20 rounded-lg">
          <p className="text-xs text-white font-semibold">Error</p>
        </div>
      )}

      {/* Expanded control panel on hover */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-30 pointer-events-none group-hover:pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl p-3 border border-white/20">
          <div className="flex flex-col gap-2">
            {/* Top row: Lighter/Darker */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => handleRegenerate(e, 'lighter')}
                className="px-3 py-1.5 text-xs bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 text-white font-medium shadow-lg"
                aria-label="Get lighter color"
                disabled={isLoading}
              >
                ↑ Lighter
              </button>
              <button
                onClick={(e) => handleRegenerate(e, 'darker')}
                className="px-3 py-1.5 text-xs bg-white/10 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 text-white font-medium shadow-lg"
                aria-label="Get darker color"
                disabled={isLoading}
              >
                ↓ Darker
              </button>
            </div>

            {/* Middle row: Warmer/Cooler */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => handleRegenerate(e, 'warmer')}
                className="px-3 py-1.5 text-xs bg-orange-500/20 rounded-lg hover:bg-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition-all duration-200 text-white font-medium shadow-lg"
                aria-label="Get warmer color"
                disabled={isLoading}
              >
                🔥 Warmer
              </button>
              <button
                onClick={(e) => handleRegenerate(e, 'cooler')}
                className="px-3 py-1.5 text-xs bg-blue-500/20 rounded-lg hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 text-white font-medium shadow-lg"
                aria-label="Get cooler color"
                disabled={isLoading}
              >
                ❄️ Cooler
              </button>
            </div>

            {/* Bottom: Smart regenerate */}
            <div className="flex justify-center pt-1 border-t border-white/10">
              <button
                onClick={handleRegenerate}
                className="px-4 py-1.5 text-xs bg-purple-500/20 rounded-lg hover:bg-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-200 text-white font-medium shadow-lg flex items-center gap-1.5"
                aria-label="Smart regenerate - suggests theme-appropriate color"
                title="Smart regenerate - suggests theme-appropriate color"
                disabled={isLoading}
              >
                <RefreshIcon />
                <span>Smart Pick</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Color info */}
      <div className="relative z-0 text-left">
        <p className="font-semibold text-white text-xs leading-tight truncate" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
          {displayName}
        </p>
        <p className="font-mono text-[10px] text-gray-200 leading-tight truncate" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
          {pantoneCode}
        </p>
      </div>
    </div>
  );
}
