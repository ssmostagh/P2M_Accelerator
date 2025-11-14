
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

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'regenerateColor',
          args: [currentColor.name, panelData.prompt]
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
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
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
          {currentColor.name}
        </p>
        <p className="font-mono text-[10px] text-gray-200 leading-tight" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
          {currentColor.code}
        </p>
      </div>
    </div>
  );
}
