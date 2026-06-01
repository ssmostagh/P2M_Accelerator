import React from 'react';
import { CloseIcon } from './TechPackIcons';

interface HistorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  images: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export const HistorySelectionModal: React.FC<HistorySelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  images,
  selectedIndex,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <CloseIcon />
            </div>
          </button>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div
                key={index}
                onClick={() => {
                  onSelect(index);
                  onClose();
                }}
                className={`
                  group relative aspect-[3/4] cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
                  ${index === selectedIndex
                    ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}
                `}
              >
                <img
                  src={img}
                  alt={`Variation ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                {/* Selection Indicator */}
                {index === selectedIndex && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
