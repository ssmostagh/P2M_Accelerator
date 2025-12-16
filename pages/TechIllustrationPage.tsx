import { useState, useCallback } from 'react';
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
  const [flatVariations, setFlatVariations] = useState<string[]>([]);
  const [selectedFlatIndex, setSelectedFlatIndex] = useState<number>(0);
  const [flatHistory, setFlatHistory] = useState<FlatHistory[]>([]);
  const [currentFlatHistoryId, setCurrentFlatHistoryId] = useState<string | null>(null);

  // Rendering State
  const [renderingVariations, setRenderingVariations] = useState<string[]>([]);
  const [selectedRenderingIndex, setSelectedRenderingIndex] = useState<number>(0);
  const [renderingHistory, setRenderingHistory] = useState<RenderingHistory[]>([]);
  const [currentRenderingHistoryId, setCurrentRenderingHistoryId] = useState<string | null>(null);

  // Regeneration State
  const [isRegeneratingRendering, setIsRegeneratingRendering] = useState<boolean>(false);
  const [isRegeneratingFlat, setIsRegeneratingFlat] = useState<boolean>(false);
  const [isRegeneratingAnnotations, setIsRegeneratingAnnotations] = useState<boolean>(false);

  const handleGenerate = useCallback(async (frontFile: File, backFile: File | null, includesBack: boolean) => {
    const frontDataUrl = URL.createObjectURL(frontFile);
    const backDataUrl = backFile ? URL.createObjectURL(backFile) : null;

    setUploadedImages({
      front: { file: frontFile, dataUrl: frontDataUrl },
      back: backFile && backDataUrl ? { file: backFile, dataUrl: backDataUrl } : null,
    });
    setFrontIncludesBack(includesBack);
    setGeneratedImages(null);
    setFlatVariations([]);
    setFlatHistory([]);
    setRenderingVariations([]);
    setRenderingHistory([]);
    setError(null);
    setIsLoading(true);
    setWorkflowStep('analyzing');

    try {
      // Convert File to base64 data URL
      const frontBase64 = await fileToDataUrl(frontFile);
      const backBase64 = backFile ? await fileToDataUrl(backFile) : null;

      // Step 1: Analyze sketches with Gemini Pro
      setLoadingStep('Step 1/4: Analyzing your sketches with AI...');
      const frontDescription = await analyzeTechPackSketch(frontBase64);
      const backDescription = backBase64 ? await analyzeTechPackSketch(backBase64) : null;

      // Step 2: Generate 4 technical flat variations using two-step process
      setLoadingStep('Step 2/4: Generating technical flat variations (two-step process)...');

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateTechPackFlat',
          args: [frontBase64, backBase64, includesBack, frontDescription, backDescription]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate technical flat variations');
      }

      const flatData = await response.json();
      console.log('📦 Received flat data:', flatData);

      // Store all 4 flat variations in history
      const historyId = Date.now().toString();
      setFlatVariations(flatData.flatVariations);
      setSelectedFlatIndex(0);
      setFlatHistory([{
        id: historyId,
        variations: flatData.flatVariations,
        timestamp: Date.now()
      }]);
      setCurrentFlatHistoryId(historyId);

      console.log('✅ Stored', flatData.flatVariations.length, 'flat variations');

      // Move to flat selection step - pause and wait for user to select
      setWorkflowStep('selecting_flat');
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
          args: [frontBase64, backBase64, frontIncludesBack, feedback]
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

  const handleRegenerateFlat = useCallback(async (feedback?: string) => {
    if (!uploadedImages.front || !generatedImages) return;

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

  const handleRegenerateFlatVariations = useCallback(async () => {
    if (!uploadedImages.front) return;

    setIsRegeneratingFlat(true);
    setError(null);

    try {
      const frontBase64 = await fileToDataUrl(uploadedImages.front.file);
      const backBase64 = uploadedImages.back ? await fileToDataUrl(uploadedImages.back.file) : null;

      // Re-analyze sketches
      const frontDescription = await analyzeTechPackSketch(frontBase64);
      const backDescription = backBase64 ? await analyzeTechPackSketch(backBase64) : null;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateTechPackFlat',
          args: [frontBase64, backBase64, frontIncludesBack, frontDescription, backDescription]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate technical flat variations');
      }

      const flatData = await response.json();

      // Add to history
      const historyId = Date.now().toString();
      setFlatHistory(prev => [...prev, {
        id: historyId,
        variations: flatData.flatVariations,
        timestamp: Date.now()
      }]);
      setCurrentFlatHistoryId(historyId);
      setFlatVariations(flatData.flatVariations);
      setSelectedFlatIndex(0);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Regeneration failed: ${errorMessage}`);
    } finally {
      setIsRegeneratingFlat(false);
    }
  }, [uploadedImages, frontIncludesBack]);

  const handleContinueToAnnotations = useCallback(async () => {
    if (!uploadedImages.front || flatVariations.length === 0) return;

    setIsLoading(true);
    setWorkflowStep('generating_annotations');
    setError(null);

    try {
      const selectedFlat = flatVariations[selectedFlatIndex];

      // Step 3: Generate annotations on the selected technical flat
      setLoadingStep('Step 3/4: Adding technical annotations to the flat...');

      const annotationResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateAnnotatedTechPack',
          args: [selectedFlat, null, frontIncludesBack]
        })
      });

      if (!annotationResponse.ok) {
        throw new Error('Failed to generate annotated tech pack');
      }

      const annotationData = await annotationResponse.json();

      // Store annotated version
      setGeneratedImages({
        flatCombined: selectedFlat,
        renderingCombined: null,
        annotatedOverlay: annotationData.annotatedImage,
        annotations: annotationData.annotations
      });

      // Step 4: Generate photorealistic rendering variations
      setLoadingStep('Step 4/4: Generating photorealistic 3D rendering variations...');
      setWorkflowStep('selecting_rendering');

      const frontBase64 = await fileToDataUrl(uploadedImages.front.file);
      const backBase64 = uploadedImages.back ? await fileToDataUrl(uploadedImages.back.file) : null;

      const frontDescription = await analyzeTechPackSketch(frontBase64);
      const backDescription = backBase64 ? await analyzeTechPackSketch(backBase64) : null;

      const renderingResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateTechPackRendering',
          args: [frontBase64, backBase64, frontIncludesBack, frontDescription, backDescription]
        })
      });

      if (!renderingResponse.ok) {
        throw new Error('Failed to generate rendering');
      }

      const renderingData = await renderingResponse.json();

      // Store all 4 rendering variations in history
      const renderingHistoryId = Date.now().toString();
      setRenderingVariations(renderingData.renderingVariations);
      setSelectedRenderingIndex(0);
      setRenderingHistory([{
        id: renderingHistoryId,
        variations: renderingData.renderingVariations,
        timestamp: Date.now()
      }]);
      setCurrentRenderingHistoryId(renderingHistoryId);

      console.log('✅ Stored', renderingData.renderingVariations.length, 'rendering variations');

      // Move to rendering selection step - pause and wait for user to select
      setWorkflowStep('selecting_rendering');
      setIsLoading(false);
      setLoadingStep('');

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Generation failed: ${errorMessage}. Please check the console for details and try again.`);
      setWorkflowStep('selecting_flat');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImages, flatVariations, selectedFlatIndex, frontIncludesBack]);

  const handleRegenerateRenderingVariations = useCallback(async () => {
    if (!uploadedImages.front) return;

    setIsRegeneratingRendering(true);
    setError(null);

    try {
      const frontBase64 = await fileToDataUrl(uploadedImages.front.file);
      const backBase64 = uploadedImages.back ? await fileToDataUrl(uploadedImages.back.file) : null;

      // Re-analyze sketches
      const frontDescription = await analyzeTechPackSketch(frontBase64);
      const backDescription = backBase64 ? await analyzeTechPackSketch(backBase64) : null;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateTechPackRendering',
          args: [frontBase64, backBase64, frontIncludesBack, frontDescription, backDescription]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate rendering variations');
      }

      const renderingData = await response.json();

      // Add to history
      const historyId = Date.now().toString();
      setRenderingHistory(prev => [...prev, {
        id: historyId,
        variations: renderingData.renderingVariations,
        timestamp: Date.now()
      }]);
      setCurrentRenderingHistoryId(historyId);
      setRenderingVariations(renderingData.renderingVariations);
      setSelectedRenderingIndex(0);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error(e);
      setError(`Regeneration failed: ${errorMessage}`);
    } finally {
      setIsRegeneratingRendering(false);
    }
  }, [uploadedImages, frontIncludesBack]);

  const handleContinueToComplete = useCallback(() => {
    if (renderingVariations.length === 0 || !generatedImages) return;

    const selectedRendering = renderingVariations[selectedRenderingIndex];

    // Update generatedImages with the selected rendering
    setGeneratedImages(prev => prev ? {
      ...prev,
      renderingCombined: selectedRendering
    } : null);

    setWorkflowStep('complete');
  }, [renderingVariations, selectedRenderingIndex, generatedImages]);

  const handleReset = () => {
    if (uploadedImages.front) {
      URL.revokeObjectURL(uploadedImages.front.dataUrl);
    }
    if (uploadedImages.back) {
      URL.revokeObjectURL(uploadedImages.back.dataUrl);
    }
    setUploadedImages({ front: null, back: null });
    setGeneratedImages(null);
    setFlatVariations([]);
    setSelectedFlatIndex(0);
    setFlatHistory([]);
    setCurrentFlatHistoryId(null);
    setRenderingVariations([]);
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
    setIsRegeneratingAnnotations(false);
  };

  return (
    <div className="h-full bg-gray-900 text-gray-100 font-sans flex flex-col overflow-auto">
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

        {/* Technical Flat Selection Screen */}
        {workflowStep === 'selecting_flat' && !isLoading && flatVariations?.length > 0 && (
          <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Preferred Technical Flat</h2>
                <p className="text-gray-400">Choose the variation that best represents your design</p>
              </div>
              <button
                onClick={handleReset}
                className="bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <ResetIcon />
                Start Over
              </button>
            </div>

            {/* History Sidebar */}
            {flatHistory.length >= 1 && (
              <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Generation History ({flatHistory.length} generation{flatHistory.length !== 1 ? 's' : ''})
                </h3>
                <div className="flex gap-3 overflow-x-auto">
                  {flatHistory.map((history, index) => (
                    <button
                      key={history.id}
                      onClick={() => {
                        setCurrentFlatHistoryId(history.id);
                        setFlatVariations(history.variations);
                        setSelectedFlatIndex(0);
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-md font-medium transition-colors ${currentFlatHistoryId === history.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      <div className="text-xs opacity-75 mb-1">Generation {index + 1}</div>
                      <div>{new Date(history.timestamp).toLocaleTimeString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Variations Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {flatVariations.map((variation, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFlatIndex(index)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${selectedFlatIndex === index
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/50 scale-[1.02]'
                      : 'border-transparent hover:border-gray-600'
                    }`}
                >
                  <div className="bg-white p-4">
                    <img
                      src={variation}
                      alt={`Technical flat variation ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className={`text-center py-3 text-sm font-semibold ${selectedFlatIndex === index ? 'bg-indigo-600' : 'bg-gray-800'
                    }`}>
                    Variation {index + 1}
                    {selectedFlatIndex === index && <span className="ml-2">✓</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRegenerateFlatVariations}
                disabled={isRegeneratingFlat}
                className="bg-gray-700 text-white font-bold py-3 px-8 rounded-md hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ResetIcon />
                {isRegeneratingFlat ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={handleContinueToAnnotations}
                className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-md hover:bg-indigo-500 transition-colors duration-300 flex items-center gap-2"
              >
                Continue with Variation {selectedFlatIndex + 1}
                <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Rendering Selection Screen */}
        {workflowStep === 'selecting_rendering' && !isLoading && renderingVariations.length > 0 && (
          <div className="w-full max-w-7xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Preferred Rendering</h2>
                <p className="text-gray-400">Choose the photorealistic rendering that best showcases your design</p>
              </div>
              <button
                onClick={handleReset}
                className="bg-gray-700 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <ResetIcon />
                Start Over
              </button>
            </div>

            {/* History Sidebar */}
            {renderingHistory.length >= 1 && (
              <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Generation History ({renderingHistory.length} generation{renderingHistory.length !== 1 ? 's' : ''})
                </h3>
                <div className="flex gap-3 overflow-x-auto">
                  {renderingHistory.map((history, index) => (
                    <button
                      key={history.id}
                      onClick={() => {
                        setCurrentRenderingHistoryId(history.id);
                        setRenderingVariations(history.variations);
                        setSelectedRenderingIndex(0);
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-md font-medium transition-colors ${currentRenderingHistoryId === history.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      <div className="text-xs opacity-75 mb-1">Generation {index + 1}</div>
                      <div>{new Date(history.timestamp).toLocaleTimeString()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4 Variations Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {renderingVariations.map((variation, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedRenderingIndex(index)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${selectedRenderingIndex === index
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/50 scale-[1.02]'
                      : 'border-transparent hover:border-gray-600'
                    }`}
                >
                  <div className="bg-white p-4">
                    <img
                      src={variation}
                      alt={`Rendering variation ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className={`text-center py-3 text-sm font-semibold ${selectedRenderingIndex === index ? 'bg-indigo-600' : 'bg-gray-800'
                    }`}>
                    Variation {index + 1}
                    {selectedRenderingIndex === index && <span className="ml-2">✓</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRegenerateRenderingVariations}
                disabled={isRegeneratingRendering}
                className="bg-gray-700 text-white font-bold py-3 px-8 rounded-md hover:bg-gray-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ResetIcon />
                {isRegeneratingRendering ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={handleContinueToComplete}
                className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-md hover:bg-indigo-500 transition-colors duration-300 flex items-center gap-2"
              >
                Continue with Variation {selectedRenderingIndex + 1}
                <span className="text-xl">→</span>
              </button>
            </div>
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
                <TechPackResultCard title="Photorealistic Rendering (Front + Back)" imageUrl={generatedImages.renderingCombined} altText="AI-generated professional rendering with front and back views" fileName="rendering-combined.png" onPreview={setPreviewingImage} onRegenerate={handleRegenerateRendering} isRegenerating={isRegeneratingRendering} />
              )}
              <TechPackResultCard title="Technical Flat (Front + Back)" imageUrl={generatedImages.flatCombined} altText="AI-generated technical flat with front and back views" fileName="technical-flat-combined.png" onPreview={setPreviewingImage} onRegenerate={handleRegenerateFlat} isRegenerating={isRegeneratingFlat} />
              {generatedImages.annotatedOverlay && (
                <TechPackResultCard title="Annotated Tech Pack" imageUrl={generatedImages.annotatedOverlay} altText="AI-generated annotated technical sketch with callouts" fileName="annotated-techpack.png" onPreview={setPreviewingImage} onRegenerate={handleRegenerateAnnotations} isRegenerating={isRegeneratingAnnotations} />
              )}
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
