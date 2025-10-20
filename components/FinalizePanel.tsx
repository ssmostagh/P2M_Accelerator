
import React from 'react';
import { DesignView } from '../types';

interface FinalizePanelProps {
  onFinalizeFront: () => void;
  onFinalizeBack: () => void;
  onGenerateBack: () => void;
  onSwitchToFront: () => void;
  onSwitchToBack: () => void;
  onDownloadImages: () => void;
  onGenerateVideo: () => void;
  onSelectVideoVariation: (url: string) => void;
  onDownloadVideo: () => void;
  isGeneratingVideo: boolean;
  videoGenerationStatus: string;
  videoVariations: string[];
  finalVideoUrl: string | null;
  view: DesignView;
  isFrontGenerated: boolean;
  isFrontFinalized: boolean;
  isBackGenerated: boolean;
  isBackFinalized: boolean;
  isLoading: boolean;
}

export const FinalizePanel: React.FC<FinalizePanelProps> = ({
  onFinalizeFront,
  onFinalizeBack,
  onGenerateBack,
  onSwitchToFront,
  onSwitchToBack,
  onDownloadImages,
  onGenerateVideo,
  onSelectVideoVariation,
  onDownloadVideo,
  isGeneratingVideo,
  videoGenerationStatus,
  videoVariations,
  finalVideoUrl,
  view,
  isFrontGenerated,
  isFrontFinalized,
  isBackGenerated,
  isBackFinalized,
  isLoading,
}) => {
  const showExportOptions = isFrontFinalized && isBackFinalized;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-purple-300">Finalize & Export</h2>
      <div className="space-y-4">
        {view === DesignView.FRONT ? (
          isFrontFinalized ? (
            <button
              onClick={onSwitchToBack}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              Edit Back Design
            </button>
          ) : (
            <>
              <p className="text-sm text-gray-400">Once you're happy with the front, finalize it to generate the back view.</p>
              <button
                onClick={onFinalizeFront}
                disabled={!isFrontGenerated || isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Finalize Front Design
              </button>
            </>
          )
        ) : (
          <>
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Now designing the back view.</p>
                <button onClick={onSwitchToFront} className="text-sm text-purple-400 hover:underline disabled:text-gray-500 disabled:no-underline" disabled={isLoading}>
                    Edit Front
                </button>
            </div>
            {!isBackGenerated && (
              <button
                onClick={onGenerateBack}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate Back View'}
              </button>
            )}
            {isBackGenerated && !isBackFinalized && (
              <button
                onClick={onFinalizeBack}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Finalize Back Design
              </button>
            )}
            {isBackFinalized && (
                <p className="text-sm text-center text-green-400 bg-green-900/50 py-2 rounded-md">Back design finalized.</p>
            )}
          </>
        )}
        
        <div className={`pt-4 border-t border-gray-700 ${showExportOptions ? 'opacity-100' : 'opacity-40'}`}>
          <div className="space-y-3">
            <button
              onClick={onDownloadImages}
              disabled={!showExportOptions || isLoading || isGeneratingVideo}
              className="w-full flex justify-center py-2 px-4 border border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Download Images
            </button>

            {isGeneratingVideo && (
              <div className="text-center">
                <svg className="animate-spin mx-auto h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs text-center text-gray-400 animate-pulse mt-2">{videoGenerationStatus}</p>
              </div>
            )}

            {videoVariations.length > 0 && !isGeneratingVideo && (
              <div>
                <h3 className="text-sm font-semibold text-center mb-2">Select a Video Variation</h3>
                <div className="grid grid-cols-3 gap-2">
                  {videoVariations.map((url, index) => (
                    <video key={index} src={url} muted loop playsInline className="w-full h-full object-cover rounded-md cursor-pointer hover:ring-2 hover:ring-pink-500" onClick={() => onSelectVideoVariation(url)} />
                  ))}
                </div>
              </div>
            )}

            {finalVideoUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-center">Final Video</h3>
                <video src={finalVideoUrl} controls className="w-full rounded-md" />
                <button onClick={onDownloadVideo} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">Download Video</button>
              </div>
            )}

            {!finalVideoUrl && !isGeneratingVideo && (
              <button
                onClick={onGenerateVideo}
                disabled={!showExportOptions || isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Generate Video
              </button>
            )}
             {finalVideoUrl && (
                <button onClick={onGenerateVideo} disabled={isGeneratingVideo} className="w-full text-center text-sm text-purple-400 hover:underline">Generate New Videos</button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
