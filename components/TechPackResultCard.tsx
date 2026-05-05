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


import React, { useState } from 'react';
import { DownloadIcon, ZoomIcon, HistoryIcon } from './TechPackIcons';

interface TechPackResultCardProps {
  title: string;
  imageUrl: string;
  overlayImage?: string; // New optional prop for annotation overlay
  // svgContent?: string;   // Optional SVG vector data
  altText: string;
  fileName: string;
  onPreview: (imageUrl: string) => void;
  onRegenerate?: (feedback?: string, isOverlayActive?: boolean) => void;
  onShowHistory?: () => void;
  isRegenerating?: boolean;
}

export const TechPackResultCard: React.FC<TechPackResultCardProps> = ({ title, imageUrl, overlayImage, /* svgContent, */ altText, fileName, onPreview, onRegenerate, onShowHistory, isRegenerating }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showOverlay, setShowOverlay] = useState(false); // State for toggle

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(feedback.trim() || undefined, showOverlay);
      setFeedback('');
      setShowFeedback(false);
    }
  };

  const currentImage = showOverlay && overlayImage ? overlayImage : imageUrl;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {overlayImage && (
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ml-2 ${showOverlay
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
          >
            {showOverlay ? 'Hide Annotations' : 'Show Annotations'}
          </button>
        )}
      </div>
      <div className="relative group aspect-box aspect-w-1 aspect-h-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-2">
        <img src={currentImage} alt={altText} className="object-contain max-h-full w-full rounded-md" />
        {isRegenerating && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
              <p className="font-semibold">Regenerating...</p>
            </div>
          </div>
        )}
        {!isRegenerating && (
          <div
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            onClick={() => onPreview(currentImage)}
            role="button"
            aria-label="View larger"
          >
            <div className="text-white flex items-center gap-2 font-semibold">
              <ZoomIcon />
              <span>View Larger</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 mt-auto bg-gray-100/50 dark:bg-gray-800/50 space-y-2">
        {onRegenerate && (
          <>
            {showFeedback && (
              <div className="space-y-2">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="E.g., 'Make the shoulder have bows instead of leaves' or 'Simplify the neckline'"
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-colors duration-200"
                  rows={3}
                  disabled={isRegenerating}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex-1 bg-purple-600 text-white text-center font-bold py-2 px-4 rounded-lg hover:bg-purple-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRegenerating ? 'Regenerating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => {
                      setShowFeedback(false);
                      setFeedback('');
                    }}
                    disabled={isRegenerating}
                    className="px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white text-center font-bold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {!showFeedback && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFeedback(true)}
                  disabled={isRegenerating}
                  className="flex-1 bg-purple-600 text-white text-center font-bold py-2 px-4 rounded-lg hover:bg-purple-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Regenerate with Feedback
                </button>
                {onShowHistory && (
                  <button
                    onClick={onShowHistory}
                    disabled={isRegenerating}
                    className="px-4 bg-blue-500 text-white text-center font-bold py-2 rounded-lg hover:bg-blue-400 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none transition-all duration-300"
                    title="View History"
                  >
                    <HistoryIcon />
                  </button>
                )}
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="px-4 bg-purple-500 text-white text-center font-bold py-2 rounded-lg hover:bg-purple-400 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none transition-all duration-300"
                  title="Regenerate without changes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
        <a
          href={currentImage} // Download whatever is currently shown
          download={fileName}
          className="w-full bg-indigo-600 text-white text-center font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <DownloadIcon />
          Download {showOverlay ? 'Annotation' : 'Image'}
        </a>
        {/* {svgContent && (
          <a
            href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`}
            download={`${fileName.split('.')[0] || 'tech-flat'}.svg`}
            className="w-full bg-emerald-600 text-white text-center font-bold py-3 px-4 rounded-lg hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-emerald-500 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
          >
            <DownloadIcon />
            Download SVG (Illustrator)
          </a>
        )} */}
      </div>
    </div>
  );
};
