import React, { useState, useCallback } from 'react';
import { TechPackImageUploader } from '../components/TechPackImageUploader';
import { TechPackResultCard } from '../components/TechPackResultCard';
import { TechPackSpinner } from '../components/TechPackSpinner';
import { TechPackImagePreviewModal } from '../components/TechPackImagePreviewModal';
import { ResetIcon } from '../components/TechPackIcons';
import { analyzeTechPackSketch } from '../services/geminiService';
import type { TechPackUploadedImage, TechPackGeneratedImages } from '../types';

interface UploadedImagesState {
  front: TechPackUploadedImage | null;
  back: TechPackUploadedImage | null;
}

export default function TechPackPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImagesState>({ front: null, back: null });
  const [frontIncludesBack, setFrontIncludesBack] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<TechPackGeneratedImages | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);

  const handleGenerate = useCallback(async (frontFile: File, backFile: File | null, includesBack: boolean) => {
    const frontDataUrl = URL.createObjectURL(frontFile);
    const backDataUrl = backFile ? URL.createObjectURL(backFile) : null;

    setUploadedImages({
      front: { file: frontFile, dataUrl: frontDataUrl },
      back: backFile && backDataUrl ? { file: backFile, dataUrl: backDataUrl } : null,
    });
    setFrontIncludesBack(includesBack);
    setGeneratedImages(null);
    setError(null);
    setIsLoading(true);

    try {
      // Convert File to base64 data URL
      const frontBase64 = await fileToDataUrl(frontFile);
      const backBase64 = backFile ? await fileToDataUrl(backFile) : null;

      // Step 1: Analyze sketches with Gemini Pro
      setLoadingStep('Analyzing your sketches with AI...');
      const frontDescription = await analyzeTechPackSketch(frontBase64);
      const backDescription = backBase64 ? await analyzeTechPackSketch(backBase64) : null;

      // Step 2: Generate assets using the descriptions
      setLoadingStep('Generating photorealistic renderings and technical flats...');

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateTechPackAssets',
          args: [frontBase64, backBase64, includesBack, frontDescription, backDescription]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate tech illustration assets');
      }

      setLoadingStep('Finalizing results...');
      const results = await response.json();
      setGeneratedImages(results);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Generation failed: ${errorMessage}. Please check the console for details and try again.`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, []);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleReset = () => {
    if (uploadedImages.front) {
      URL.revokeObjectURL(uploadedImages.front.dataUrl);
    }
    if (uploadedImages.back) {
      URL.revokeObjectURL(uploadedImages.back.dataUrl);
    }
    setUploadedImages({ front: null, back: null });
    setGeneratedImages(null);
    setError(null);
    setIsLoading(false);
    setLoadingStep('');
    setFrontIncludesBack(false);
  };

  return (
    <div className="h-full bg-gray-900 text-gray-100 font-sans flex flex-col overflow-auto">
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        {!uploadedImages.front && !isLoading && (
          <TechPackImageUploader onGenerate={handleGenerate} disabled={isLoading} onPreview={setPreviewingImage} />
        )}

        {isLoading && (
          <div className="text-center flex flex-col items-center justify-center h-full py-16">
            <TechPackSpinner />
            <p className="text-xl mt-4 font-semibold text-indigo-300">{loadingStep || 'Initializing...'}</p>
            <p className="text-gray-400 mt-2">AI is working its magic. This may take a few moments.</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center bg-red-900/50 border border-red-700 p-6 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-red-300 mb-2">An Error Occurred</h2>
            <p className="text-red-200">{error}</p>
            <button
              onClick={handleReset}
              className="mt-6 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors duration-300 flex items-center justify-center gap-2 mx-auto"
            >
              <ResetIcon />
              Try Again
            </button>
          </div>
        )}

        {!isLoading && generatedImages && uploadedImages.front && (
          <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">Your Generated Assets</h2>
                <button
                onClick={handleReset}
                className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                <ResetIcon />
                Start Over
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {frontIncludesBack ? (
                <TechPackResultCard title="Your Sketch (Front & Back)" imageUrl={uploadedImages.front.dataUrl} altText="User's uploaded sketch with front and back views" fileName="original-sketch-combined.png" onPreview={setPreviewingImage} />
              ) : (
                <>
                  <TechPackResultCard title="Your Sketch (Front)" imageUrl={uploadedImages.front.dataUrl} altText="User's uploaded front sketch" fileName="original-sketch-front.png" onPreview={setPreviewingImage} />
                  {uploadedImages.back && <TechPackResultCard title="Your Sketch (Back)" imageUrl={uploadedImages.back.dataUrl} altText="User's uploaded back sketch" fileName="original-sketch-back.png" onPreview={setPreviewingImage} />}
                </>
              )}
              <TechPackResultCard title="Rendering (Front)" imageUrl={generatedImages.renderingFront} altText="AI-generated professional rendering of front" fileName="rendering-front.png" onPreview={setPreviewingImage} />
              <TechPackResultCard title="Rendering (Back)" imageUrl={generatedImages.renderingBack} altText="AI-generated professional rendering of back" fileName="rendering-back.png" onPreview={setPreviewingImage} />
              <TechPackResultCard title="Technical Flat (Front)" imageUrl={generatedImages.flatFront} altText="AI-generated technical flat of front" fileName="technical-flat-front.png" onPreview={setPreviewingImage} />
              <TechPackResultCard title="Technical Flat (Back)" imageUrl={generatedImages.flatBack} altText="AI-generated technical flat of back" fileName="technical-flat-back.png" onPreview={setPreviewingImage} />
            </div>
          </div>
        )}
      </main>
      {previewingImage && (
        <TechPackImagePreviewModal imageUrl={previewingImage} onClose={() => setPreviewingImage(null)} />
      )}
    </div>
  );
}
