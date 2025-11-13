
import React from 'react';

interface VideoPlayerModalProps {
  videoUrl: string;
  onClose: () => void;
  onSelect?: () => void;
  showSelectButton?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  videoUrl,
  onClose,
  onSelect,
  showSelectButton = false
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-gray-800 p-4 rounded-lg max-w-3xl w-full">
        <button onClick={onClose} className="absolute top-2 right-2 text-white text-2xl">&times;</button>
        <video src={videoUrl} controls autoPlay className="w-full h-auto rounded-md mb-4" />

        {showSelectButton && onSelect && (
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect();
                onClose();
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Select This Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
