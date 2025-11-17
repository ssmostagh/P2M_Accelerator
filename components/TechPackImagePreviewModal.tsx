
import React, { useEffect } from 'react';
import { CloseIcon } from './TechPackIcons';

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const TechPackImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50"
        onClick={onClose}
        aria-label="Close preview"
      >
        <CloseIcon />
      </button>
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Full-size preview" className="block max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};
