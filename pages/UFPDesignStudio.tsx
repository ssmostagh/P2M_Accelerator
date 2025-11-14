import React, { useState, useCallback } from 'react';
import { VirtualTryOn } from '../components/VirtualTryOn';
import { FabricLibrary } from '../components/FabricLibrary';
import { EditStudio } from '../components/EditStudio';
import { FinalizePanel } from '../components/FinalizePanel';
import { HistoryPanel } from '../components/HistoryPanel';
import { generatePrompt, editImage, generateInitialImageVariations, generateEditVariations, generateVideoVariations } from '../services/geminiService';
import { DesignView, HistoryGroup, HistoryActionType, HistoryImage } from '../types';

const App: React.FC = () => {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [garmentImage, setGarmentImage] = useState<File | null>(null);
  
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [finalFrontImage, setFinalFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [finalBackImage, setFinalBackImage] = useState<string | null>(null);

  const [editPrompt, setEditPrompt] = useState<string>('');
  const [history, setHistory] = useState<HistoryGroup[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<boolean>(false);
  const [editVariations, setEditVariations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [designView, setDesignView] = useState<DesignView>(DesignView.FRONT);

  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string>('');
  const [videoVariations, setVideoVariations] = useState<string[]>([]);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  
  const [targetGarment, setTargetGarment] = useState<string>('');

  const resetFinalization = () => {
    setFinalFrontImage(null);
    setBackImage(null);
    setFinalBackImage(null);
    setFinalVideoUrl(null);
    setVideoVariations([]);
  };

  const logActionToHistory = (type: HistoryActionType, images: string[], prompt?: string) => {
    const newGroup: HistoryGroup = {
      id: Date.now().toString(),
      type,
      prompt,
      images: images.map((imageUrl, index) => ({
        id: `${Date.now()}-${index}`,
        imageUrl,
      })),
    };
    setHistory(prev => [newGroup, ...prev]);
  };

  const handleInitialGenerate = useCallback(async () => {
    if (!modelImage || !garmentImage) {
      setError('Please provide both a model image and a garment image.');
      return;
    }
    setIsGeneratingVariations(true);
    setError(null);
    setCurrentImage(null);
    setDesignView(DesignView.FRONT);
    setHistory([]);
    setEditVariations([]);
    resetFinalization();

    try {
      const prompt = await generatePrompt(garmentImage);
      const variations = await generateInitialImageVariations(modelImage, garmentImage, prompt, 4);
      setEditVariations(variations);
      if (variations.length > 0) {
        setCurrentImage(variations[0]);
        logActionToHistory(HistoryActionType.INITIAL, variations);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during initial generation.');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [modelImage, garmentImage]);

  const handleEditGenerate = useCallback(async () => {
    const imageToEdit = designView === DesignView.FRONT ? currentImage : backImage;
    if (!imageToEdit || !editPrompt) {
      setError('No image to edit or no edit prompt provided.');
      return;
    }
    setIsGeneratingVariations(true);
    setError(null);
    setEditVariations([]);

    try {
      const variations = await generateEditVariations(imageToEdit, editPrompt);
      setEditVariations(variations);
      logActionToHistory(HistoryActionType.EDIT, variations, editPrompt);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image editing.');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [currentImage, backImage, editPrompt, designView]);

  const handleSelectVariation = (selectedImage: string) => {
    if (designView === DesignView.FRONT) {
      setCurrentImage(selectedImage);
      resetFinalization();
    } else {
      setBackImage(selectedImage);
    }
    setEditVariations([]);
  };

  const handleFabricSelect = useCallback(async (fabricPrompt: string, fabricName: string) => {
    const imageToEdit = designView === DesignView.FRONT ? currentImage : backImage;
    if (!imageToEdit) {
      setError('Please generate an image before selecting a fabric.');
      return;
    }
    if (!targetGarment) {
      setError('Please specify the target garment to apply the fabric to.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditVariations([]);

    try {
      const specificPrompt = `For the person in the image, change the fabric of ${targetGarment} to look like this: ${fabricPrompt}. Keep the person, background, and any other clothing items unchanged.`;
      const editedImage = await editImage(imageToEdit, specificPrompt);
      if (designView === DesignView.FRONT) {
        setCurrentImage(editedImage);
        resetFinalization();
      } else {
        setBackImage(editedImage);
      }
      logActionToHistory(HistoryActionType.FABRIC, [editedImage], `${fabricName} on ${targetGarment}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while changing fabric.');
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, backImage, designView, targetGarment]);

  const handleGenerateBack = useCallback(async () => {
    if (!finalFrontImage) {
      setError('Please finalize a front design first.');
      return;
    }
    setIsGeneratingVariations(true);
    setError(null);
    setBackImage(null);
    setEditVariations([]);

    try {
      const prompt = `Generate the back view of the person wearing this garment. Maintain the style and fabric.`;
      const variations = await generateEditVariations(finalFrontImage, prompt);
      if (variations.length > 0) {
        setBackImage(variations[0]);
        setEditVariations(variations);
        setDesignView(DesignView.BACK); // Auto-switch to back view
        logActionToHistory(HistoryActionType.BACK_VIEW, variations);
      } else {
        setError("Could not generate back view variations.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the back view.');
    } finally {
      setIsGeneratingVariations(false);
    }
  }, [finalFrontImage]);

  const handleSelectHistory = (image: HistoryImage) => {
    const activeImage = designView === DesignView.FRONT ? currentImage : backImage;
    if (image.imageUrl === activeImage) return;

    if (designView === DesignView.FRONT) {
        setCurrentImage(image.imageUrl);
        resetFinalization();
    } else {
        setBackImage(image.imageUrl);
    }
    setEditVariations([]);
  };

  const handleFinalize = () => {
    if (currentImage) {
      setFinalFrontImage(currentImage);
    } else {
      setError("No front design to finalize.");
    }
  };
  
  const handleFinalizeBack = () => {
    if (backImage) {
      setFinalBackImage(backImage);
    } else {
      setError("No back design to finalize.");
    }
  };

  const handleSwitchToFront = () => {
    setDesignView(DesignView.FRONT);
  };

  const handleSwitchToBack = () => {
    if (finalFrontImage) {
      setDesignView(DesignView.BACK);
    } else {
      setError("Finalize the front design before switching to the back view.");
    }
  };

  const handleDownloadImages = () => {
    if (finalFrontImage) {
      const link = document.createElement('a');
      link.href = finalFrontImage;
      link.download = 'final_design_front.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    if (finalBackImage) {
      const link = document.createElement('a');
      link.href = finalBackImage;
      link.download = 'final_design_back.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleGenerateVideo = useCallback(async () => {
    if (!finalFrontImage || !finalBackImage) {
      setError('Both front and back designs must be finalized to generate a video.');
      return;
    }
    setIsGeneratingVideo(true);
    setVideoVariations([]);
    setFinalVideoUrl(null);
    setError(null);

    try {
      const urls = await generateVideoVariations(finalFrontImage, (status) => {
        setVideoGenerationStatus(status);
      });
      setVideoVariations(urls);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during video generation.');
    } finally {
      setIsGeneratingVideo(false);
      setVideoGenerationStatus('');
    }
  }, [finalFrontImage, finalBackImage]);

  const handleSelectVideoVariation = (url: string) => {
    setFinalVideoUrl(url);
    setVideoVariations([]);
  };

  const handleDownloadVideo = () => {
    if (finalVideoUrl) {
      const link = document.createElement('a');
      link.href = finalVideoUrl;
      link.download = 'final_design_video.mp4';
      document.body.appendChild(link);
      link.click();
      // No need to remove child for blob URLs, but good practice
      // URL.revokeObjectURL(finalVideoUrl) could be used here if we manage blobs more directly
    }
  };

  const isAppBusy = isLoading || isGeneratingVariations || isGeneratingVideo;
  const isImageEditable = !!(designView === DesignView.FRONT ? currentImage : backImage);

  return (
    <div className="h-full p-2 sm:p-4 lg:p-6 bg-gray-900 font-sans flex flex-col overflow-hidden">
      {error && (
        <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative mb-6 max-w-4xl mx-auto flex-shrink-0" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-300" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      <main className="grid grid-cols-12 gap-4 flex-grow min-h-0 overflow-hidden">
        {/* Column 1 */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
          <VirtualTryOn
            modelImage={modelImage}
            setModelImage={setModelImage}
            garmentImage={garmentImage}
            setGarmentImage={setGarmentImage}
            onGenerate={handleInitialGenerate}
            isLoading={isGeneratingVariations && !currentImage && !finalFrontImage}
          />
          <FabricLibrary 
            onSelectFabric={handleFabricSelect}
            isActionable={isImageEditable && !isAppBusy}
            targetGarment={targetGarment}
            setTargetGarment={setTargetGarment}
          />
        </div>

        {/* Column 2 */}
        <div className="col-span-6 flex flex-col overflow-y-auto">
          <EditStudio
            image={designView === DesignView.FRONT ? currentImage : backImage}
            prompt={editPrompt}
            setPrompt={setEditPrompt}
            onGenerate={handleEditGenerate}
            isLoading={isLoading}
            isGeneratingVariations={isGeneratingVariations}
            editVariations={editVariations}
            onSelectVariation={handleSelectVariation}
            view={designView}
            hasFinalizedFront={!!finalFrontImage}
          />
        </div>

        {/* Column 3 */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <FinalizePanel
            onFinalizeFront={handleFinalize}
            onFinalizeBack={handleFinalizeBack}
            onGenerateBack={handleGenerateBack}
            onSwitchToFront={handleSwitchToFront}
            onSwitchToBack={handleSwitchToBack}
            onDownloadImages={handleDownloadImages}
            onGenerateVideo={handleGenerateVideo}
            onSelectVideoVariation={handleSelectVideoVariation}
            onDownloadVideo={handleDownloadVideo}
            isGeneratingVideo={isGeneratingVideo}
            videoGenerationStatus={videoGenerationStatus}
            videoVariations={videoVariations}
            finalVideoUrl={finalVideoUrl}
            view={designView}
            isFrontGenerated={!!currentImage}
            isFrontFinalized={!!finalFrontImage}
            isBackGenerated={!!backImage}
            isBackFinalized={!!finalBackImage}
            isLoading={isAppBusy}
          />
          <HistoryPanel history={history} onSelect={handleSelectHistory} />
        </div>
      </main>
    </div>
  );
};

export default App;