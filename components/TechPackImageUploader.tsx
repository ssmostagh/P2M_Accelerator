
import React, { useState } from 'react';
import { SparklesIcon, AddIcon } from './TechPackIcons';

interface UploaderZoneProps {
  title: string;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  previewUrl: string | null;
  disabled: boolean;
  onPreview: (url: string) => void;
}

const UploaderZone: React.FC<UploaderZoneProps> = ({ title, onFileSelect, onFileRemove, previewUrl, disabled, onPreview }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    e.target.value = ''; // Allow re-uploading the same file
  };

  return (
    <div className="w-full">
      <label htmlFor={`file-input-${title.replace(/\s+/g, '-')}`} className="block text-sm font-medium text-gray-300 mb-2">
        {title}
      </label>
      <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-indigo-500 transition-colors">
        <div className="space-y-1 text-center">
          {previewUrl ? (
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto h-32 w-32 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onPreview(previewUrl)}
              />
              {!disabled && (
                <button
                  onClick={onFileRemove}
                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full transition-all z-10"
                  aria-label="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-400 justify-center">
                <label htmlFor={`file-input-${title.replace(/\s+/g, '-')}`} className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500 px-3 py-1.5">
                  <span>Upload</span>
                  <input
                    id={`file-input-${title.replace(/\s+/g, '-')}`}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="sr-only"
                    disabled={disabled}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface TechPackImageUploaderProps {
  onGenerate: (front: File, back: File | null, frontIncludesBack: boolean) => void;
  disabled: boolean;
  onPreview: (url: string) => void;
}

export const TechPackImageUploader: React.FC<TechPackImageUploaderProps> = ({ onGenerate, disabled, onPreview }) => {
  const [front, setFront] = useState<{ file: File, url: string } | null>(null);
  const [back, setBack] = useState<{ file: File, url: string } | null>(null);
  const [frontIncludesBack, setFrontIncludesBack] = useState(false);
  const [showBackUploader, setShowBackUploader] = useState(false);

  const handleFileSelect = (type: 'front' | 'back') => (file: File) => {
    const setter = type === 'front' ? setFront : setBack;
    setter({ file, url: URL.createObjectURL(file) });
  };

  const handleFileRemove = (type: 'front' | 'back') => () => {
    if (type === 'front' && front) {
      URL.revokeObjectURL(front.url);
      setFront(null);
      setShowBackUploader(false);
      setFrontIncludesBack(false);
      if (back) {
        URL.revokeObjectURL(back.url);
        setBack(null);
      }
    } else if (type === 'back' && back) {
      URL.revokeObjectURL(back.url);
      setBack(null);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setFrontIncludesBack(isChecked);
    if (isChecked) {
      setShowBackUploader(false);
      if (back) {
        handleFileRemove('back')();
      }
    }
  };

  const handleShowBackUploader = () => {
    setShowBackUploader(true);
    setFrontIncludesBack(false);
  };

  const handleGenerateClick = () => {
    if (front) {
      onGenerate(front.file, back?.file ?? null, frontIncludesBack);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">Create Your Tech Illustration Assets</h1>
        <p className="mt-2 text-lg text-gray-400">Upload your design sketch to get started.</p>
      </div>

      <div className="w-full flex flex-col md:flex-row justify-center items-start gap-8">
        <div className="w-full md:w-1/2 flex flex-col items-center gap-4">
            <UploaderZone title="Front View Sketch" onFileSelect={handleFileSelect('front')} onFileRemove={handleFileRemove('front')} previewUrl={front?.url ?? null} disabled={disabled} onPreview={onPreview} />
            {front && (
                <div className="flex flex-col items-center gap-4 mt-2">
                    {!showBackUploader && (
                        <label className="flex items-center justify-center gap-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={frontIncludesBack}
                                onChange={handleCheckboxChange}
                                disabled={disabled}
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                            />
                            This sketch includes the back view
                        </label>
                    )}
                    {!frontIncludesBack && !showBackUploader && (
                        <button
                            onClick={handleShowBackUploader}
                            disabled={disabled}
                            className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors"
                        >
                            <AddIcon className="w-6 h-6" />
                            Do you have a back view to upload?
                        </button>
                    )}
                </div>
            )}
        </div>

        {showBackUploader && (
            <div className="w-full md:w-1/2">
                <UploaderZone title="Back View Sketch" onFileSelect={handleFileSelect('back')} onFileRemove={handleFileRemove('back')} previewUrl={back?.url ?? null} disabled={disabled} onPreview={onPreview} />
            </div>
        )}
      </div>

      {front && (
        <button
            onClick={handleGenerateClick}
            disabled={disabled}
            className="mt-4 w-full max-w-xs bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
            <SparklesIcon className="w-6 h-6" />
            Generate Assets
        </button>
      )}
    </div>
  );
};
