
import React, { useState, useEffect } from 'react';

interface VirtualTryOnProps {
  modelImage: File | null;
  setModelImage: (file: File | null) => void;
  garmentImage: File | null;
  setGarmentImage: (file: File | null) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const ImageUpload: React.FC<{
  file: File | null;
  setFile: (file: File | null) => void;
  label: string;
  id: string;
}> = ({ file, setFile, label, id }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
          ) : (
            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div className="flex text-sm text-gray-400 justify-center">
            <label htmlFor={id} className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-purple-500 px-2 py-1">
              <span>Upload a file</span>
              <input id={id} name={id} type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
        </div>
      </div>
    </div>
  );
};

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  modelImage,
  setModelImage,
  garmentImage,
  setGarmentImage,
  onGenerate,
  isLoading,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-purple-300">Virtual Try-On</h2>
      <div className="space-y-4 flex-grow">
        <ImageUpload file={garmentImage} setFile={setGarmentImage} label="Garment Image" id="garment-upload" />
        <ImageUpload file={modelImage} setFile={setModelImage} label="Model Image" id="model-upload" />
      </div>
      <div className="mt-6">
        <button
          onClick={onGenerate}
          disabled={!modelImage || !garmentImage || isLoading}
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : 'Generate Try-On'}
        </button>
      </div>
    </div>
  );
};