
import React, { useEffect, useState } from 'react';
import { useGeminiImage } from '../hooks/useGeminiImage.ts';
import { Loader } from './Loader.tsx';
import { RefreshIcon, CheckIcon, XIcon, RewriteIcon, HistoryIcon } from './icons.tsx';
import type { ImagePanelData, PanelLayout } from '../types.ts';

interface ImageHistoryItem {
  url: string;
  timestamp: number;
  prompt?: string;
}

// Note: API calls will be handled through backend

interface ImageCardProps {
  panelData: ImagePanelData;
  layout: PanelLayout;
  collectionTitle?: string;
  collectionKeywords?: string;
  collectionAudience?: string;
}

export function ImageCard({ panelData, layout, collectionTitle, collectionKeywords, collectionAudience }: ImageCardProps) {
  const { imageUrl, isLoading, error, generate, setDirectImageUrl } = useGeminiImage();
  const [isEditing, setIsEditing] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptForRegen, setPromptForRegen] = useState(panelData.prompt);
  const [isRewriting, setIsRewriting] = useState(false);
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    if (panelData.prompt && layout.aspectRatio) {
      generate(panelData.prompt, layout.aspectRatio);
    }
  }, [panelData.prompt, layout.aspectRatio, generate]);

  // Auto-retry on error
  useEffect(() => {
    if (error && retryCount < MAX_RETRIES && layout.aspectRatio) {
      console.log(`Image generation failed, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        generate(panelData.prompt, layout.aspectRatio!);
      }, 2000); // Wait 2 seconds before retry

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, panelData.prompt, layout.aspectRatio, generate]);

  // Track image history when a new image is generated
  useEffect(() => {
    if (imageUrl && !isLoading) {
      setImageHistory(prev => {
        // Don't add duplicates
        if (prev.some(item => item.url === imageUrl)) {
          return prev;
        }
        return [...prev, {
          url: imageUrl,
          timestamp: Date.now(),
          prompt: promptForRegen
        }];
      });
    }
  }, [imageUrl, isLoading, promptForRegen]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPromptForRegen(panelData.prompt);
    setShowTypeSelector(true);
  };

  const generatePromptForType = (type: string): string => {
    const figureBasePrompt = `A single, professional, high-quality fashion photograph. Theme: '${collectionTitle || 'Fashion Collection'}'. Keywords: ${collectionKeywords || 'stylish, modern'}. IMPORTANT: Show only ONE subject or scene. Do NOT create a grid, collage, or multiple images. Do NOT include text or labels. Audience: ${collectionAudience || 'Fashion enthusiasts'}.`;
    const nonFigureBasePrompt = `A single, professional, high-quality photograph. Theme: '${collectionTitle || 'Fashion Collection'}'. Keywords: ${collectionKeywords || 'stylish, modern'}. IMPORTANT: Show only ONE subject or scene. Do NOT create a grid, collage, or multiple images. Do NOT include text or labels. Do NOT include people or models in the image. Focus on the subject matter. Audience: ${collectionAudience || 'Fashion enthusiasts'}.`;
    const illustrationBasePrompt = `A single, professional, high-quality fashion illustration. Theme: '${collectionTitle || 'Fashion Collection'}'. Keywords: ${collectionKeywords || 'stylish, modern'}. IMPORTANT: Show only ONE subject or scene. Do NOT create a grid, collage, or multiple images. Do NOT include text or labels. Style: artistic, hand-drawn, watercolor, digital illustration, or fashion sketch. Audience: ${collectionAudience || 'Fashion enthusiasts'}.`;

    switch (type) {
      case 'object':
        return `${nonFigureBasePrompt} Focus on: A single fashion object or accessory (e.g., handbag, shoes, jewelry, belt, hat, sunglasses). Shot in editorial style with dramatic lighting against a clean background.`;
      case 'fabric':
        return `${nonFigureBasePrompt} Focus on: A close-up texture shot of fabric, material, or finishing detail. Show the weave, pattern, or surface quality. Macro photography style emphasizing material properties.`;
      case 'scenery':
        return `${nonFigureBasePrompt} Focus on: An environmental scene or location that captures the mood and aesthetic. No people. Atmospheric shot of a place, architecture, or landscape that evokes the collection's vibe.`;
      case 'figure':
        return `${figureBasePrompt} Focus on: A fashion model or figure showcasing the style. Full body or artistic cropped shot. Emphasize pose, silhouette, and attitude that matches the collection's aesthetic.`;
      case 'texture':
        return `${nonFigureBasePrompt} Focus on: Extreme close-up of surface texture, pattern, or material detail. Abstract and artistic, emphasizing tactile qualities and visual interest.`;
      case 'illustration':
        return `${illustrationBasePrompt} Focus on: A fashion illustration showing the collection's aesthetic. Can be a fashion figure, garment flat, or artistic interpretation. Emphasize artistic style, clean lines, and the collection's mood and vibe.`;
      default:
        return panelData.prompt;
    }
  };

  const handleSelectType = (type: string) => {
    const newPrompt = generatePromptForType(type);
    setPromptForRegen(newPrompt);
    setShowTypeSelector(false);
    setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setShowTypeSelector(false);
    setShowHistory(false);
  };

  const handleShowHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHistory(true);
  };

  const handleSelectFromHistory = (historyItem: ImageHistoryItem) => {
    // Use the stored URL directly without regenerating
    setDirectImageUrl(historyItem.url);
    setShowHistory(false);
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(0); // Reset retry counter on manual regeneration
    if (layout.aspectRatio) {
      generate(promptForRegen, layout.aspectRatio);
    }
    setIsEditing(false);
  };

  const handleRewritePrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRewriting(true);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'rewritePrompt',
          args: [promptForRegen]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite prompt');
      }

      const newPrompt = await response.json();
      setPromptForRegen(newPrompt);
    } catch (err) {
      console.error("Prompt rewriting failed:", err);
      alert("Failed to rewrite prompt.");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div
      className={`group relative rounded-lg overflow-hidden shadow-lg bg-base-800 transition-all duration-300 ease-in-out ${layout.gridClass}`}
      aria-label={`Moodboard image for prompt: ${panelData.prompt}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-800/70 z-20">
          <Loader />
        </div>
      )}
      {error && !isLoading && retryCount >= MAX_RETRIES && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/50 p-2 text-center z-20">
          <p className="text-sm text-white font-semibold">Generation Failed</p>
          <p className="text-xs text-red-200">{error}</p>
          <p className="text-xs text-red-300 mt-1">After {MAX_RETRIES} retries</p>
        </div>
      )}
      {imageUrl && !isLoading && (
        <img
          src={imageUrl}
          alt={panelData.prompt}
          className="w-full h-full object-cover animate-fade-in"
        />
      )}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 flex items-center justify-center z-10 ${(isEditing || showTypeSelector || showHistory) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => { if (isEditing || showTypeSelector || showHistory) e.stopPropagation() }}
      >
        {showHistory ? (
          <div className="w-full h-full flex flex-col p-3 sm:p-4 gap-2 bg-base-800/90 backdrop-blur-sm overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-semibold">History ({imageHistory.length})</h3>
              <button
                onClick={(e) => { e.stopPropagation(); setShowHistory(false); }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <XIcon />
              </button>
            </div>
            {imageHistory.length === 0 ? (
              <p className="text-gray-400 text-xs text-center mt-4">No history yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 overflow-auto">
                {imageHistory.map((item, index) => (
                  <button
                    key={item.timestamp}
                    onClick={() => handleSelectFromHistory(item)}
                    className="relative group/thumb aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-primary transition-all"
                  >
                    <img
                      src={item.url}
                      alt={`History ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Select</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                      <span className="text-white text-[10px]">
                        #{imageHistory.length - index}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : showTypeSelector ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 gap-2 bg-base-800/90 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-sm font-semibold mb-2">Select Image Type</h3>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              <button
                onClick={() => handleSelectType('object')}
                className="px-2 py-2 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white text-center"
              >
                Object
              </button>
              <button
                onClick={() => handleSelectType('fabric')}
                className="px-2 py-2 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white text-center"
              >
                Material
              </button>
              <button
                onClick={() => handleSelectType('scenery')}
                className="px-2 py-2 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white text-center"
              >
                Scenery
              </button>
              <button
                onClick={() => handleSelectType('figure')}
                className="px-2 py-2 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white text-center"
              >
                Figure
              </button>
              <button
                onClick={() => handleSelectType('texture')}
                className="px-2 py-2 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white text-center"
              >
                Texture
              </button>
              <button
                onClick={() => handleSelectType('illustration')}
                className="px-2 py-2 bg-brand-primary/80 hover:bg-brand-primary text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white text-center"
              >
                Illustration
              </button>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowTypeSelector(false); }}
              className="mt-2 px-4 py-2 bg-red-500/50 hover:bg-red-500/80 text-white rounded-lg text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            >
              Cancel
            </button>
          </div>
        ) : isEditing ? (
          <div className="w-full h-full flex flex-col p-3 sm:p-4 gap-2 bg-base-800/80 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            <textarea
              value={promptForRegen}
              onChange={(e) => setPromptForRegen(e.target.value)}
              className="w-full flex-1 bg-base-900 border border-base-700 rounded-md text-xs text-white p-2 focus:ring-2 focus:ring-brand-primary resize-none disabled:opacity-70"
              disabled={isRewriting}
            />
            <div className="flex justify-between items-center gap-2">
              <button
                onClick={handleRewritePrompt}
                className="p-2 bg-purple-500/50 rounded-full hover:bg-purple-500/80 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Rewrite prompt with AI"
                disabled={isRewriting}
              >
                {isRewriting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <RewriteIcon />}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="p-2 bg-red-500/50 rounded-full hover:bg-red-500/80 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Cancel edit"
                >
                  <XIcon />
                </button>
                <button
                  onClick={handleRegenerate}
                  className="p-2 bg-green-500/50 rounded-full hover:bg-green-500/80 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Confirm regeneration"
                >
                  <CheckIcon />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleShowHistory}
              className="p-3 bg-blue-500/50 rounded-full backdrop-blur-sm hover:bg-blue-500/80 focus:outline-none focus:ring-2 focus:ring-white transition-transform duration-200 transform active:scale-90"
              aria-label="View history"
              disabled={isLoading}
            >
              <HistoryIcon />
            </button>
            <button
              onClick={handleStartEdit}
              className="p-3 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-transform duration-200 transform active:scale-90"
              aria-label="Regenerate image with custom prompt"
              disabled={isLoading}
            >
              <RefreshIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
