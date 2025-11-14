
import React from 'react';
import { DesignView } from '../types';

interface EditStudioProps {
  image: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isGeneratingVariations: boolean;
  editVariations: string[];
  onSelectVariation: (imageUrl: string) => void;
  view: DesignView;
  hasFinalizedFront: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="w-full h-full bg-gray-700 rounded-lg animate-pulse"></div>
);

const Placeholder: React.FC<{ view: DesignView, hasFinalizedFront: boolean }> = ({ view, hasFinalizedFront }) => {
  let title = "Design Studio";
  let text = "Generate a virtual try-on to begin designing.";

  if (view === DesignView.BACK) {
    title = "Back View Design";
    text = hasFinalizedFront ? "Generate the back view of your design." : "Finalize the front design first to work on the back.";
  }

  return (
    <div className="w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-center p-8">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 className="text-xl font-semibold text-gray-300">{title}</h3>
      <p className="text-gray-400 mt-2">{text}</p>
    </div>
  );
};

const VariationSkeleton: React.FC = () => (
    <div className="aspect-w-1 aspect-h-1 bg-gray-700 rounded-md animate-pulse"></div>
);

export const EditStudio: React.FC<EditStudioProps> = ({
  image,
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
  isGeneratingVariations,
  editVariations,
  onSelectVariation,
  view,
  hasFinalizedFront,
}) => {
  const canEdit = (view === DesignView.FRONT && image) || (view === DesignView.BACK && image);

  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-lg h-full flex flex-col">
      <h2 className="text-lg font-bold mb-2 text-purple-300">
        {view === DesignView.FRONT ? 'Design Studio: Front View' : 'Design Studio: Back View'}
      </h2>

      {(isGeneratingVariations || editVariations.length > 0) && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold mb-1 text-gray-300">
            {isGeneratingVariations ? 'Generating Variations...' : 'Select a Variation'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {isGeneratingVariations ? (
              <>
                <VariationSkeleton />
                <VariationSkeleton />
                <VariationSkeleton />
              </>
            ) : (
              editVariations.map((variationUrl, index) => (
                <div 
                  key={index} 
                  className="aspect-w-1 aspect-h-1 cursor-pointer group rounded-md overflow-hidden"
                  onClick={() => onSelectVariation(variationUrl)}
                  role="button"
                  aria-label={`Select variation ${index + 1}`}
                >
                  <img 
                    src={variationUrl} 
                    alt={`Variation ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ring-2 ring-transparent group-hover:ring-pink-500" 
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="aspect-w-1 aspect-h-1 w-full bg-gray-900 rounded-lg overflow-hidden mb-2 flex-grow min-h-0">
        {isLoading && !image ? <LoadingSkeleton /> : 
          image ? (
            <div className="relative w-full h-full">
              <img src={image} alt="Generated design" className="w-full h-full object-contain" />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <Placeholder view={view} hasFinalizedFront={hasFinalizedFront} />
          )
        }
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          rows={2}
          className="flex-grow bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white p-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
          placeholder={canEdit ? "e.g., change color to navy blue, add a zipper" : "Generate an image to start editing"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={!canEdit || isLoading || isGeneratingVariations}
        />
        <button
          onClick={onGenerate}
          disabled={!canEdit || !prompt || isLoading || isGeneratingVariations}
          className="sm:w-32 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          {isGeneratingVariations ? 'Editing...' : 'Generate Edit'}
        </button>
      </div>
    </div>
  );
};
