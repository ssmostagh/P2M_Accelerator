
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

  const handleRegenerate = async (e: React.MouseEvent, direction?: 'lighter' | 'darker') => {
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
      className={`group relative rounded-lg overflow-hidden shadow-lg transition-colors duration-300 ease-in-out flex flex-col justify-end p-2 ${layout.gridClass}`}
      style={{ backgroundColor: currentColor.code }}
      aria-label={`Color swatch: ${currentColor.name}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader />
        </div>
      )}
      {error && !isLoading && (
         <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-1 text-center z-20">
          <p className="text-xs text-white font-semibold">Error</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 z-10">
        <div className="flex gap-2">
          <button
            onClick={(e) => handleRegenerate(e, 'lighter')}
            className="px-3 py-1 text-xs bg-white/20 rounded backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-transform duration-200 transform active:scale-90 text-white font-medium"
            aria-label="Get lighter color"
            disabled={isLoading}
          >
            ↑ Lighter
          </button>
          <button
            onClick={(e) => handleRegenerate(e, 'darker')}
            className="px-3 py-1 text-xs bg-white/20 rounded backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-transform duration-200 transform active:scale-90 text-white font-medium"
            aria-label="Get darker color"
            disabled={isLoading}
          >
            ↓ Darker
          </button>
        </div>
        <button
          onClick={handleRegenerate}
          className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-transform duration-200 transform active:scale-90"
          aria-label="Regenerate color"
          disabled={isLoading}
        >
          <RefreshIcon />
        </button>
      </div>
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
