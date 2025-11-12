
import React from 'react';

interface VideoPlayerModalProps {
  videoUrl: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ videoUrl, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-gray-800 p-4 rounded-lg max-w-3xl w-full">
        <button onClick={onClose} className="absolute top-2 right-2 text-white text-2xl">&times;</button>
        <video src={videoUrl} controls autoPlay className="w-full h-auto rounded-md" />
      </div>
    </div>
  );
};
