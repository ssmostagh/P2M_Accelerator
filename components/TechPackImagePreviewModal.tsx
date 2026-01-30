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
