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

import { useState, useCallback } from 'react';
import { TechPackImageUploader } from '../components/TechPackImageUploader';
import { HistorySelectionModal } from '../components/HistorySelectionModal';
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

type WorkflowStep = 'upload' | 'analyzing' | 'selecting_flat' | 'generating_annotations' | 'selecting_rendering' | 'complete';

interface FlatHistory {
  id: string;
  variations: string[];
  timestamp: number;
}

interface RenderingHistory {
  id: string;
  variations: string[];
  timestamp: number;
}

export default function TechPackPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImagesState>({ front: null, back: null });
  const [frontIncludesBack, setFrontIncludesBack] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<TechPackGeneratedImages | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<string | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');

  // Technical Flat State
  const [selectedFlatIndex, setSelectedFlatIndex] = useState<number>(0);
  const [flatHistory, setFlatHistory] = useState<FlatHistory[]>([]);
  const [currentFlatHistoryId, setCurrentFlatHistoryId] = useState<string | null>(null);
  const [selectedRenderingIndex, setSelectedRenderingIndex] = useState<number>(0);
  const [renderingHistory, setRenderingHistory] = useState<RenderingHistory[]>([]);
  const [currentRenderingHistoryId, setCurrentRenderingHistoryId] = useState<string | null>(null);

  // Regeneration State
  const [isRegeneratingRendering, setIsRegeneratingRendering] = useState<boolean>(false);
  const [isRegeneratingFlat, setIsRegeneratingFlat] = useState<boolean>(false);
  /* const [isRegeneratingAnnotations, setIsRegeneratingAnnotations] = useState<boolean>(false); */

  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [historyModalType, setHistoryModalType] = useState<'flat' | 'rendering'>('flat');

  const [garmentDescriptions, setGarmentDescriptions] = useState<{ front: string; back: string | null } | null>(null);

  const handleGenerate = useCallback(async (frontFile: File, backFile: File | null, includesBack: boolean) => {
    const frontDataUrl = URL.createObjectURL(frontFile);
    const backDataUrl = backFile ? URL.createObjectURL(backFile) : null;

    setUploadedImages({
      front: { file: frontFile, dataUrl: frontDataUrl },
      back: backFile && backDataUrl ? { file: backFile, dataUrl: backDataUrl } : null,
    });
    setFrontIncludesBack(includesBack);
    setGeneratedImages(null);
    setFlatHistory([]);
    setRenderingHistory([]);
    setError(null);
    setIsLoading(true);
    setWorkflowStep('analyzing');

    try {
      // Convert File to base64 data URL
      const [frontBase64, backBase64] = await Promise.all([
        fileToDataUrl(frontFile),
        backFile ? fileToDataUrl(backFile) : Promise.resolve(null)
      ]);

      // Step 1: Analyze sketches with Gemini Pro
      setLoadingStep('Analyzing your sketches with AI...');
      const [frontDescription, backDescription] = await Promise.all([
        analyzeTechPackSketch(frontBase64),
        backBase64 ? analyzeTechPackSketch(backBase64) : Promise.resolve(null)
      ]);
      setGarmentDescriptions({ front: frontDescription, back: backDescription });

      // Step 2: Generate Flat and Rendering (SINGLE)
      setLoadingStep('Generating technical flat and photorealistic rendering...');

      const [flatResponse, renderingResponse] = await Promise.all([
        fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            func: 'generateTechPackFlat',
            args: [frontBase64, backBase64, includesBack, frontDescription, backDescription]
          })
        }),
        fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            func: 'generateTechPackRendering',
            args: [frontBase64, backBase64, includesBack, frontDescription, backDescription]
          })
        })
      ]);

      if (!flatResponse.ok || !renderingResponse.ok) {
        throw new Error('Failed to generate images');
      }

      const [flatData, renderingData] = await Promise.all([
        flatResponse.json(),
        renderingResponse.json()
      ]);

      console.log('📦 Received flat data:', flatData);
      console.log('📦 Received rendering data:', renderingData);

      // Step 3: Auto-generate Annotations using the Flat
      setLoadingStep('Generating technical annotations...');
      const annotationResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateAnnotatedTechPack',
          args: [flatData.flatCombined, null, includesBack]
        })
      });

      if (!annotationResponse.ok) throw new Error('Failed to generate annotated tech pack');
      const annotationData = await annotationResponse.json();

      // Store Results
      const historyId = Date.now().toString();

      // Update History (Single item arrays)
      setFlatHistory([{
        id: historyId,
        variations: [flatData.flatCombined],
        timestamp: Date.now()
      }]);
      setCurrentFlatHistoryId(historyId);

      setRenderingHistory([{
        id: historyId,
        variations: [renderingData.renderingCombined],
        timestamp: Date.now()
      }]);
      setCurrentRenderingHistoryId(historyId);

      setGeneratedImages({
        flatCombined: flatData.flatCombined,
        renderingCombined: renderingData.renderingCombined,
        annotatedOverlay: annotationData.annotatedImage,
        annotations: annotationData.annotations
      });

      setWorkflowStep('complete');
      setIsLoading(false);
      setLoadingStep('');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Generation failed: ${errorMessage}. Please check the console for details and try again.`);
      setWorkflowStep('upload');
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

  const handleRegenerateRendering = useCallback(async (feedback?: string) => {
    if (!uploadedImages.front || !generatedImages) return;

    setIsRegeneratingRendering(true);
    setError(null);

    try {
      const frontBase64 = await fileToDataUrl(uploadedImages.front.file);
      const backBase64 = uploadedImages.back ? await fileToDataUrl(uploadedImages.back.file) : null;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'regenerateTechPackRendering',
          args: [frontBase64, backBase64, frontIncludesBack, feedback, garmentDescriptions?.front, garmentDescriptions?.back]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate rendering');
      }

      const result = await response.json();
      setGeneratedImages(prev => prev ? { ...prev, renderingCombined: result.renderingCombined } : null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Regeneration failed: ${errorMessage}`);
    } finally {
      setIsRegeneratingRendering(false);
    }
  }, [uploadedImages, generatedImages, frontIncludesBack]);

  /* 
   * Smart Regeneration:
   * - If user is viewing Annotations (isOverlayActive=true), ONLY regenerate annotations logic.
   * - If user is viewing Flat (isOverlayActive=false/undefined), regenerate Flat FIRST, then Annotations.
   */
  const handleRegenerateFlat = useCallback(async (feedback?: string, isOverlayActive?: boolean) => {
    if (!uploadedImages.front || !generatedImages) return;

    // Case 1: Only regenerate Annotations (Overlay is Active)
    if (isOverlayActive) {
      /* setIsRegeneratingAnnotations(true); */ // Re-using flat spinner for simplicity or add specific state
      setIsRegeneratingFlat(true); // Using same spinner for now
      setError(null);

      try {
        console.log('🎨 Regenerating ONLY Annotations (Smart Mode)');

        // Use the CURRENT flat image
        const currentFlat = generatedImages.flatCombined;

        const annotationResponse = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            func: 'generateAnnotatedTechPack',
            args: [currentFlat, null, frontIncludesBack, feedback]
          })
        });

        if (!annotationResponse.ok) throw new Error('Failed to regenerate annotations');

        const annotationData = await annotationResponse.json();

        setGeneratedImages(prev => prev ? {
          ...prev,
          annotatedOverlay: annotationData.annotatedImage,
          annotations: annotationData.annotations
        } : null);

      } catch (e) {
        console.error(e);
        setError('Failed to regenerate annotations');
      } finally {
        setIsRegeneratingFlat(false);
      }
      return;
    }

    // Case 2: Full Regeneration (Flat + Annotations) - Existing Logic
    setIsRegeneratingFlat(true);
    setError(null);

    try {
      const frontBase64 = await fileToDataUrl(uploadedImages.front.file);
      const backBase64 = uploadedImages.back ? await fileToDataUrl(uploadedImages.back.file) : null;

      // Step 1: Regenerate the technical flat
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'regenerateTechPackFlat',
          args: [frontBase64, backBase64, frontIncludesBack, feedback]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate technical flat');
      }

      const result = await response.json();
      const newFlat = result.flatCombined;

      // Step 2: Automatically regenerate annotations for the new flat
      const annotationResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateAnnotatedTechPack',
          args: [newFlat, null, frontIncludesBack]
        })
      });

      if (!annotationResponse.ok) {
        throw new Error('Failed to regenerate annotations');
      }

      const annotationData = await annotationResponse.json();

      // Update both the flat and annotations
      setGeneratedImages(prev => prev ? {
        ...prev,
        flatCombined: newFlat,
        annotatedOverlay: annotationData.annotatedImage,
        annotations: annotationData.annotations
      } : null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Regeneration failed: ${errorMessage}`);
    } finally {
      setIsRegeneratingFlat(false);
    }
  }, [uploadedImages, generatedImages, frontIncludesBack]);

  /*
  const handleRegenerateAnnotations = useCallback(async () => {
    if (!generatedImages?.flatCombined) return;

    setIsRegeneratingAnnotations(true);
    setError(null);

    try {
      const annotationResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateAnnotatedTechPack',
          args: [generatedImages.flatCombined, null, frontIncludesBack]
        })
      });

      if (!annotationResponse.ok) {
        throw new Error('Failed to regenerate annotations');
      }

      const annotationData = await annotationResponse.json();

      // Update only the annotations, keep the flat the same
      setGeneratedImages(prev => prev ? {
        ...prev,
        annotatedOverlay: annotationData.annotatedImage,
        annotations: annotationData.annotations
      } : null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Regeneration failed: ${errorMessage}`);
    } finally {
      setIsRegeneratingAnnotations(false);
    }
  }, [generatedImages, frontIncludesBack]);
  */









  const handleReset = () => {
    if (uploadedImages.front) {
      URL.revokeObjectURL(uploadedImages.front.dataUrl);
    }
    if (uploadedImages.back) {
      URL.revokeObjectURL(uploadedImages.back.dataUrl);
    }
    setUploadedImages({ front: null, back: null });
    setGeneratedImages(null);
    setSelectedFlatIndex(0);
    setFlatHistory([]);
    setCurrentFlatHistoryId(null);
    setSelectedRenderingIndex(0);
    setRenderingHistory([]);
    setCurrentRenderingHistoryId(null);
    setError(null);
    setIsLoading(false);
    setLoadingStep('');
    setWorkflowStep('upload');
    setFrontIncludesBack(false);
    setIsRegeneratingRendering(false);
    setIsRegeneratingFlat(false);
    /* setIsRegeneratingAnnotations(false); */
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans flex flex-col overflow-auto transition-colors duration-200">
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        {workflowStep === 'upload' && !isLoading && (
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





        {/* Final Results Screen */}
        {!isLoading && generatedImages && uploadedImages.front && workflowStep === 'complete' && (
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
              {generatedImages.renderingCombined && (
                <TechPackResultCard
                  title="Photorealistic Rendering (Front + Back)"
                  imageUrl={generatedImages.renderingCombined}
                  altText="AI-generated professional rendering with front and back views"
                  fileName="rendering-combined.png"
                  onPreview={setPreviewingImage}
                  onRegenerate={handleRegenerateRendering}
                  isRegenerating={isRegeneratingRendering}
                  onShowHistory={() => {
                    setHistoryModalType('rendering');
                    setHistoryModalOpen(true);
                  }}
                />
              )}
              <TechPackResultCard
                title="Technical Flat (Front + Back)"
                imageUrl={generatedImages.flatCombined}
                overlayImage={generatedImages.annotatedOverlay}
                altText="AI-generated technical flat with front and back views"
                fileName="technical-flat-combined.png"
                onPreview={setPreviewingImage}
                onRegenerate={handleRegenerateFlat}
                isRegenerating={isRegeneratingFlat}
                onShowHistory={() => {
                  setHistoryModalType('flat');
                  setHistoryModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        <HistorySelectionModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={historyModalType === 'flat' ? "Technical Flat History" : "Rendering History"}
          images={
            historyModalType === 'flat'
              ? flatHistory.flatMap(h => h.variations)
              : renderingHistory.flatMap(h => h.variations)
          }
          selectedIndex={historyModalType === 'flat' ? selectedFlatIndex : selectedRenderingIndex}
          onSelect={(index) => {
            // We need to look up the image URL from the history
            // Flatten the list similarly to how we pass it to 'images'
            const flatList = historyModalType === 'flat'
              ? flatHistory.flatMap(h => h.variations)
              : renderingHistory.flatMap(h => h.variations);

            const selectedUrl = flatList[index];

            if (historyModalType === 'flat') {
              setSelectedFlatIndex(index);
              // We might need to assume 1 variation per history entry if flattened?
              // Actually flatVariations is just string[]. historyModal uses flatHistory?
              // Wait, flatVariations is the CURRENT history session's variations.
              // flatHistory is persistent?
              // Let's check definitions.
              // flatVariations: string[]
              setGeneratedImages(prev => prev ? { ...prev, flatCombined: selectedUrl } : null);
            } else {
              setSelectedRenderingIndex(index);
              setGeneratedImages(prev => prev ? { ...prev, renderingCombined: selectedUrl } : null);
            }
          }}
        />
      </main >
      {previewingImage && (
        <TechPackImagePreviewModal imageUrl={previewingImage} onClose={() => setPreviewingImage(null)} />
      )}
    </div>
  );
}
