

import React from 'react';
import { VideoPlayerModal } from './VideoPlayerModal';
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
  const [showVideoModal, setShowVideoModal] = React.useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = React.useState<string | null>(null);

  const handlePlayVideo = () => {
    if (finalVideoUrl) {
      setShowVideoModal(true);
    }
  };

  return (
    <div className="bg-gray-800 border-gray-700 rounded-lg shadow-lg flex-shrink-0">
      <div className="p-3">
        <h2 className="text-purple-300 text-lg font-bold">Finalize & Export</h2>
      </div>
      <div className="px-3 pb-3 space-y-3">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={onSwitchToFront}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              view === DesignView.FRONT
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={isLoading}
          >
            Front View
          </button>
          <button
            onClick={onSwitchToBack}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
              view === DesignView.BACK
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            disabled={isLoading || !isFrontFinalized}
          >
            Back View
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {view === DesignView.FRONT && isFrontGenerated && (
            <button
              onClick={onFinalizeFront}
              disabled={isLoading}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all"
            >
              {isFrontFinalized ? '✓ Re-finalize Front Design' : '✓ Finalize Front Design'}
            </button>
          )}

          {isFrontFinalized && !isBackGenerated && (
            <button
              onClick={onGenerateBack}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all"
            >
              → Generate Back View
            </button>
          )}

          {view === DesignView.BACK && isBackGenerated && (
            <button
              onClick={onFinalizeBack}
              disabled={isLoading}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all"
            >
              {isBackFinalized ? '✓ Re-finalize Back Design' : '✓ Finalize Back Design'}
            </button>
          )}
        </div>

        {(isFrontFinalized || isBackFinalized) && (
          <div className="border-t border-gray-700 pt-4 space-y-2">
            <h3 className="text-lg font-semibold text-gray-300">Finalized Designs</h3>
            {isFrontFinalized && <p className="text-sm text-green-400">✓ Front design finalized</p>}
            {isBackFinalized && <p className="text-sm text-green-400">✓ Back design finalized</p>}
          </div>
        )}

        <div className="border-t border-gray-700 pt-4 space-y-3">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Export</h3>

          <button
            onClick={onDownloadImages}
            disabled={!isFrontFinalized && !isBackFinalized || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all"
          >
            ⬇ Download Images
          </button>

          {isFrontFinalized && isBackFinalized && (
            <>
              <button
                onClick={onGenerateVideo}
                disabled={isGeneratingVideo || isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all"
              >
                {isGeneratingVideo ? '⏳ Generating Video...' : '🎬 Generate Catwalk Video'}
              </button>

              {isGeneratingVideo && (
                <p className="text-sm text-purple-400 text-center animate-pulse">{videoGenerationStatus}</p>
              )}

              {videoVariations.length > 0 && (
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-300 mb-2">Preview & Select Video</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {videoVariations.map((videoUrl, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={videoUrl}
                          className="w-full h-auto object-cover rounded-md cursor-pointer hover:ring-4 hover:ring-purple-500 transition-all"
                          onClick={() => setPreviewVideoUrl(videoUrl)}
                          muted
                          autoPlay
                          loop
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-40 rounded-md">
                          <span className="text-white font-semibold">Click to Preview</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {finalVideoUrl && (
                <div className="space-y-2 bg-gray-700 p-3 rounded-lg">
                  <button
                    onClick={handlePlayVideo}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
                  >
                    ▶ Play Final Video
                  </button>
                  <button
                    onClick={onDownloadVideo}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
                  >
                    ⬇ Download Video
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showVideoModal && finalVideoUrl && (
        <VideoPlayerModal
          videoUrl={finalVideoUrl}
          onClose={() => setShowVideoModal(false)}
        />
      )}

      {previewVideoUrl && (
        <VideoPlayerModal
          videoUrl={previewVideoUrl}
          onClose={() => setPreviewVideoUrl(null)}
          onSelect={() => onSelectVideoVariation(previewVideoUrl)}
          showSelectButton={true}
        />
      )}
    </div>
  );
};

