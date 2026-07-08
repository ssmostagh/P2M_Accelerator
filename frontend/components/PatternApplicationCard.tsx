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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { DownloadIcon, ZoomIcon, SparklesIcon, ResetIcon } from './TechPackIcons';

interface PatternApplicationCardProps {
  onApplyPattern: (swatchFile: File) => Promise<void>;
  isApplying: boolean;
  patternedFlatUrl: string | null;
  swatchPreviewUrl: string | null;
  onPreview: (url: string) => void;
  onReset: () => void;
  error: string | null;
}

export const PatternApplicationCard: React.FC<PatternApplicationCardProps> = ({
  onApplyPattern,
  isApplying,
  patternedFlatUrl,
  swatchPreviewUrl,
  onPreview,
  onReset,
  error
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onApplyPattern(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col border border-gray-200 dark:border-gray-700 transition-colors duration-200 h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-purple-900/20">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pattern Application</h3>
        </div>
        {patternedFlatUrl && (
          <button
            onClick={onReset}
            className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
            disabled={isApplying}
          >
            <ResetIcon />
            <span>Change Swatch</span>
          </button>
        )}
      </div>

      <div className="relative flex-grow flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 min-h-[280px]">
        {isApplying ? (
          <div className="flex flex-col items-center justify-center space-y-4 w-full h-full p-4">
            {swatchPreviewUrl && (
              <img src={swatchPreviewUrl} alt="Swatch Preview" className="h-16 w-16 object-cover rounded-full border-2 border-purple-500 animate-pulse" />
            )}
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto"></div>
            <p className="font-semibold text-purple-300 text-center text-sm">Applying pattern swatch to tech flat...</p>
          </div>
        ) : patternedFlatUrl ? (
          <div className="relative group w-full h-full flex items-center justify-center">
            <img src={patternedFlatUrl} alt="Tech flat with applied pattern" className="object-contain max-h-[350px] w-full rounded-md" />
            <div
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer rounded-md"
              onClick={() => onPreview(patternedFlatUrl)}
              role="button"
              aria-label="View larger"
            >
              <div className="text-white flex items-center gap-2 font-semibold">
                <ZoomIcon />
                <span>View Larger</span>
              </div>
            </div>
            {swatchPreviewUrl && (
              <div className="absolute bottom-2 right-2 bg-black/70 p-1.5 rounded-lg border border-purple-500/50 backdrop-blur-sm flex flex-col items-center shadow-lg">
                <span className="text-[10px] text-purple-300 font-semibold mb-1">Swatch</span>
                <img src={swatchPreviewUrl} alt="Applied swatch" className="h-10 w-10 object-cover rounded" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-purple-500 transition-colors">
            <svg className="mx-auto h-12 w-12 text-purple-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">Upload Pattern Swatch</h4>
            <p className="text-xs text-gray-400 mb-4 max-w-[220px]">Upload a swatch (check, plaid, texture, floral) to apply it to your technical flat.</p>
            <label htmlFor="pattern-swatch-input" className="relative cursor-pointer bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm shadow-md">
              <span>Choose Swatch File</span>
              <input
                id="pattern-swatch-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="sr-only"
                disabled={isApplying}
              />
            </label>
          </div>
        )}
      </div>

      {error && !isApplying && (
        <div className="p-3 bg-red-900/50 border-t border-red-700 text-center">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {patternedFlatUrl && !isApplying && (
        <div className="p-4 mt-auto bg-gray-100/50 dark:bg-gray-800/50">
          <a
            href={patternedFlatUrl}
            download="tech-flat-patterned.png"
            className="w-full bg-indigo-600 text-white text-center font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <DownloadIcon />
            Download Patterned Flat
          </a>
        </div>
      )}
    </div>
  );
};
