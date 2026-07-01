/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under permissions and
 * limitations under the License.
 */

import { useState, useCallback } from 'react';
import { SparklesIcon, DownloadIcon, ResetIcon, ZoomIcon, HistoryIcon } from '../components/TechPackIcons';
import { TechPackImagePreviewModal } from '../components/TechPackImagePreviewModal';
import { TechPackSpinner } from '../components/TechPackSpinner';
import { HistorySelectionModal } from '../components/HistorySelectionModal';
import { TechPackResultCard } from '../components/TechPackResultCard';

interface ImageState {
  file: File;
  dataUrl: string;
}

interface PatternHistoryItem {
  id: string;
  techFlat: ImageState;
  swatch: ImageState;
  patternedResultUrl: string;
  timestamp: number;
}

export default function PatternApplierPage() {
  const [techFlat, setTechFlat] = useState<ImageState | null>(null);
  const [swatch, setSwatch] = useState<ImageState | null>(null);
  const [patternedResult, setPatternedResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<PatternHistoryItem[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(0);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = useCallback(async (overrideSwatch?: ImageState) => {
    const currentSwatch = overrideSwatch || swatch;
    if (!techFlat || !currentSwatch) return;

    setIsLoading(true);
    setError(null);
    setPatternedResult(null);

    try {
      const [flatBase64, swatchBase64] = await Promise.all([
        fileToDataUrl(techFlat.file),
        fileToDataUrl(currentSwatch.file)
      ]);

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'applyTechPackPattern',
          args: [flatBase64, swatchBase64]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply pattern to technical flat');
      }

      const result = await response.json();
      const resultUrl = result.patternedImage;
      setPatternedResult(resultUrl);

      const newItem: PatternHistoryItem = {
        id: Date.now().toString(),
        techFlat: techFlat,
        swatch: currentSwatch,
        patternedResultUrl: resultUrl,
        timestamp: Date.now(),
      };

      setHistory(prev => {
        const nextHistory = [...prev, newItem];
        setSelectedHistoryIndex(nextHistory.length - 1);
        return nextHistory;
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Pattern application failed: ${errorMessage}. Please check the console for details.`);
    } finally {
      setIsLoading(false);
    }
  }, [techFlat, swatch]);

  const handleRegeneratePattern = useCallback(async (feedback?: string) => {
    if (!techFlat || !swatch) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const [flatBase64, swatchBase64] = await Promise.all([
        fileToDataUrl(techFlat.file),
        fileToDataUrl(swatch.file)
      ]);

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'applyTechPackPattern',
          args: [flatBase64, swatchBase64, feedback]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate pattern application');
      }

      const result = await response.json();
      const resultUrl = result.patternedImage;
      setPatternedResult(resultUrl);

      const newItem: PatternHistoryItem = {
        id: Date.now().toString(),
        techFlat: techFlat,
        swatch: swatch,
        patternedResultUrl: resultUrl,
        timestamp: Date.now(),
      };

      setHistory(prev => {
        const nextHistory = [...prev, newItem];
        setSelectedHistoryIndex(nextHistory.length - 1);
        return nextHistory;
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Pattern regeneration failed: ${errorMessage}. Please check the console for details.`);
    } finally {
      setIsRegenerating(false);
    }
  }, [techFlat, swatch]);

  const handleReset = () => {
    if (techFlat) URL.revokeObjectURL(techFlat.dataUrl);
    if (swatch) URL.revokeObjectURL(swatch.dataUrl);
    setTechFlat(null);
    setSwatch(null);
    setPatternedResult(null);
    setError(null);
    setIsLoading(false);
    setIsRegenerating(false);
    setHistory([]);
    setSelectedHistoryIndex(0);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans flex flex-col overflow-auto transition-colors duration-200">
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600 mb-2">
            Textile Pattern Studio
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Instantly apply fabric patterns and swatches to your technical flat illustrations.
          </p>
        </div>

        {/* Workspace Flow */}
        {!patternedResult && !isLoading && (
          <div className="w-full flex flex-col items-center gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {/* Box 1: Tech Flat Upload */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col items-center text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">1. Technical Flat Illustration</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Upload the line art or tech flat blueprint</p>
                {techFlat ? (
                  <div className="relative group w-full aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-gray-200 dark:border-gray-700">
                    <img src={techFlat.dataUrl} alt="Tech flat preview" className="object-contain w-full h-full rounded-md" />
                    <button
                      onClick={() => { URL.revokeObjectURL(techFlat.dataUrl); setTechFlat(null); }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 z-10"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      onClick={() => setPreviewingImage(techFlat.dataUrl)}
                    >
                      <div className="text-white flex items-center gap-2 font-semibold">
                        <ZoomIcon />
                        <span>View Larger</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="tech-flat-input" className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg hover:border-purple-500 cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                    <svg className="h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Choose Line Art Image</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</span>
                    <input
                      id="tech-flat-input"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setTechFlat({ file: e.target.files[0], dataUrl: URL.createObjectURL(e.target.files[0]) });
                        }
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              {/* Box 2: Swatch Upload */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col items-center text-center">
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">2. Fabric Pattern Swatch</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Upload the check, plaid, floral, or fabric tile</p>
                {swatch ? (
                  <div className="relative group w-full aspect-square bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-gray-200 dark:border-gray-700">
                    <img src={swatch.dataUrl} alt="Swatch preview" className="object-cover w-full h-full rounded-md" />
                    <button
                      onClick={() => { URL.revokeObjectURL(swatch.dataUrl); setSwatch(null); }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 z-10"
                      title="Remove swatch"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                      onClick={() => setPreviewingImage(swatch.dataUrl)}
                    >
                      <div className="text-white flex items-center gap-2 font-semibold">
                        <ZoomIcon />
                        <span>View Swatch</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label htmlFor="swatch-input" className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg hover:border-purple-500 cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                    <svg className="h-12 w-12 text-gray-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">Choose Swatch Image</span>
                    <span className="text-xs text-gray-400 mt-1">Checks, Plaids, Prints</span>
                    <input
                      id="swatch-input"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSwatch({ file: e.target.files[0], dataUrl: URL.createObjectURL(e.target.files[0]) });
                        }
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="text-center bg-red-900/50 border border-red-700 p-4 rounded-lg max-w-2xl w-full">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {techFlat && swatch && (
              <button
                onClick={() => handleGenerate()}
                className="w-full max-w-xs bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-300 shadow-xl flex items-center justify-center gap-2 text-lg"
              >
                <SparklesIcon className="w-6 h-6" />
                Apply Pattern Swatch
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="text-center flex flex-col items-center justify-center h-full py-20">
            <TechPackSpinner />
            <p className="text-xl mt-4 font-semibold text-indigo-300">Applying your pattern swatch...</p>
            <p className="text-gray-400 mt-2">Gemini AI is wrapping the textile seamlessly onto your technical flat.</p>
          </div>
        )}

        {/* Results Screen */}
        {!isLoading && patternedResult && techFlat && swatch && (
          <div className="w-full max-w-6xl flex flex-col items-center gap-8">
            <div className="w-full flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold text-white">Your Patterned Technical Flat</h2>
              <button
                onClick={handleReset}
                className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors duration-300 flex items-center gap-2"
              >
                <ResetIcon />
                Start Over
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
              {/* Inputs Summary Column */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
                  <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Original Flat Illustration</h3>
                  <div className="aspect-box aspect-w-1 aspect-h-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-90" onClick={() => setPreviewingImage(techFlat.dataUrl)}>
                    <img src={techFlat.dataUrl} alt="Original Tech Flat" className="object-contain max-h-48 w-full rounded" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Uploaded Swatch</h3>
                    <label htmlFor="swap-swatch-input" className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 px-2.5 rounded cursor-pointer shadow transition-colors">
                      Swap Swatch
                      <input
                        id="swap-swatch-input"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const newSwatchFile = e.target.files[0];
                            const newSwatchDataUrl = URL.createObjectURL(newSwatchFile);
                            const newSwatchState = { file: newSwatchFile, dataUrl: newSwatchDataUrl };
                            setSwatch(newSwatchState);
                            handleGenerate(newSwatchState);
                          }
                          e.target.value = '';
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <div className="aspect-box aspect-w-1 aspect-h-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-90" onClick={() => setPreviewingImage(swatch.dataUrl)}>
                    <img src={swatch.dataUrl} alt="Pattern Swatch" className="object-cover max-h-48 w-full rounded" />
                  </div>
                </div>
              </div>

              {/* Main Result Column with TechPackResultCard */}
              <div className="lg:col-span-2">
                <TechPackResultCard
                  title="Applied Pattern Illustration"
                  imageUrl={patternedResult}
                  altText="Applied pattern result"
                  fileName="patterned-tech-flat.png"
                  onPreview={setPreviewingImage}
                  onRegenerate={handleRegeneratePattern}
                  isRegenerating={isRegenerating}
                  onShowHistory={history.length > 0 ? () => setHistoryModalOpen(true) : undefined}
                />
              </div>
            </div>
          </div>
        )}

        <HistorySelectionModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="Pattern Application History"
          images={history.map(h => h.patternedResultUrl)}
          selectedIndex={selectedHistoryIndex}
          onSelect={(index) => {
            setSelectedHistoryIndex(index);
            setPatternedResult(history[index].patternedResultUrl);
            setTechFlat(history[index].techFlat);
            setSwatch(history[index].swatch);
          }}
        />
      </main>

      {previewingImage && (
        <TechPackImagePreviewModal imageUrl={previewingImage} onClose={() => setPreviewingImage(null)} />
      )}
    </div>
  );
}
