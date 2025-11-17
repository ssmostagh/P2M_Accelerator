
import React from 'react';
import { DownloadIcon, ZoomIcon } from './TechPackIcons';

interface TechPackResultCardProps {
  title: string;
  imageUrl: string;
  altText: string;
  fileName: string;
  onPreview: (imageUrl: string) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const TechPackResultCard: React.FC<TechPackResultCardProps> = ({ title, imageUrl, altText, fileName, onPreview, onRegenerate, isRegenerating }) => {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl shadow-black/20 flex flex-col border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="relative group aspect-box aspect-w-1 aspect-h-1 bg-gray-900 flex items-center justify-center p-2">
        <img src={imageUrl} alt={altText} className="object-contain max-h-full w-full rounded-md" />
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
            onClick={() => onPreview(imageUrl)}
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
      <div className="p-4 mt-auto bg-gray-800/50 space-y-2">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="w-full bg-purple-600 text-white text-center font-bold py-2 px-4 rounded-lg hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        )}
        <a
          href={imageUrl}
          download={fileName}
          className="w-full bg-indigo-600 text-white text-center font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <DownloadIcon />
          Download
        </a>
      </div>
    </div>
  );
};
