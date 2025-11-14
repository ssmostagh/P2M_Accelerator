import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { InputForm } from '../components/InputForm';
import { MoodboardGrid } from '../components/MoodboardGrid';
import { SparklesIcon } from '../components/icons';
import {
  PANEL_LAYOUTS,
  FIGURE_PROMPTS,
  OBJECT_PROMPTS,
  SCENERY_PROMPTS,
  TEXTURE_PROMPTS,
  getAudienceFigureConstraint
} from '../constants/moodboardConstants';
import type { FormState, PanelData, PantoneColor } from '../types';

// Note: API calls will be handled through the backend server

export default function MoodboardPage() {
  const [formState, setFormState] = useState<FormState>({
    title: 'Autumn/Winter 2025 Collection',
    keywords: 'structured tailoring, dark academia, wool, leather, muted earth tones, sophisticated, androgynous',
    audience: 'High-fashion consumers, editorial stylists, luxury retail buyers',
  });
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const moodboardRef = useRef<HTMLDivElement>(null);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setPanels([]);
    const { title, keywords, audience } = formState;

    if (!title || !keywords) {
        alert("Please provide a title and keywords.");
        setIsGenerating(false);
        return;
    }

    const colorPrompt = `Generate a color palette of 8 complementary colors for a fashion collection with the theme '${title}' and keywords '${keywords}'. For each color, provide: 1) An accurate, real Pantone color code (e.g., "PANTONE 19-4052 TCX" or "PANTONE 16-1546 TPX"), and 2) The corresponding hex code. Use only real, existing Pantone colors from the Pantone Matching System.`;
    const imageBasePrompt = `A single, professional, high-quality fashion photograph. Theme: '${title}'. Keywords: ${keywords}. IMPORTANT: Show only ONE subject or scene. Do NOT create a grid, collage, or multiple images. Do NOT include text or labels. Unless explicitly specified, do NOT include people or models in the image. Focus on objects, details, scenery, or textures. Audience: ${audience}.`;

    try {
      // Call backend API for color generation
      const colorResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          func: 'generateColorPalette',
          args: [title, keywords]
        })
      });

      if (!colorResponse.ok) {
        throw new Error('Failed to generate color palette');
      }

      const colorData = await colorResponse.json();
      const colors: PantoneColor[] = colorData.colors || [];

      if (colors.length < 8) {
        throw new Error('Could not generate a full color palette.');
      }

      // Image prompt generation logic
      const promptAssignments: string[] = [];

      // Shuffle all prompt categories
      const shuffledFigures = shuffleArray(FIGURE_PROMPTS);
      const shuffledObjects = shuffleArray(OBJECT_PROMPTS);
      const shuffledScenery = shuffleArray(SCENERY_PROMPTS);
      const shuffledTextures = shuffleArray(TEXTURE_PROMPTS);

      // Assign prompts with no figures - only objects, scenery, and textures
      // 0 Figures, 4 Objects, 2 Scenery, 2 Textures = 8 total image prompts
      promptAssignments.push(...shuffledObjects.slice(0, 4));
      promptAssignments.push(...shuffledScenery.slice(0, 2));
      promptAssignments.push(...shuffledTextures.slice(0, 2));

      // Shuffle the final list of 8 prompts to randomize their grid position
      const finalPrompts = shuffleArray(promptAssignments);
      let imagePromptIndex = 0;

      // Get audience constraints for figures
      const audienceConstraint = getAudienceFigureConstraint(audience);

      const newPanels: PanelData[] = PANEL_LAYOUTS.map((layout) => {
        if (layout.type === 'color') {
          return {
            id: layout.id,
            type: 'color',
            color: colors[layout.id - 1], // IDs 1-8 map to colors[0-7]
            prompt: colorPrompt
          };
        } else { // type is 'image'
          const modifier = finalPrompts[imagePromptIndex++];
          // If this is a figure prompt, append audience constraints
          const isFigurePrompt = FIGURE_PROMPTS.some(fp => modifier.includes(fp));
          const fullPrompt = isFigurePrompt
            ? `${imageBasePrompt} ${modifier} IMPORTANT: ${audienceConstraint}`
            : `${imageBasePrompt} ${modifier}`;

          return {
            id: layout.id,
            type: 'image',
            prompt: fullPrompt,
          };
        }
      });

      setPanels(newPanels);
    } catch (error) {
      console.error("Generation failed:", error);
      alert(`Failed to generate moodboard. Please check the console for details. Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  }, [formState]);

  const handleExportMoodboard = useCallback(async () => {
    if (!moodboardRef.current || panels.length === 0) {
      alert('Please generate a moodboard first before exporting.');
      return;
    }

    setIsExporting(true);

    try {
      // Capture the moodboard as canvas
      const canvas = await html2canvas(moodboardRef.current, {
        backgroundColor: '#111827', // bg-gray-900
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${formState.title.replace(/[^a-z0-9]/gi, '_')}_moodboard.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export moodboard. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [panels, formState.title]);

  return (
    <div className="flex flex-col h-full bg-base-900 text-base-200">
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-0 overflow-hidden relative">
        {/* Export Button */}
        {panels.length > 0 && (
          <button
            onClick={handleExportMoodboard}
            disabled={isExporting}
            className="absolute top-8 right-8 z-30 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export as PNG
              </>
            )}
          </button>
        )}

        <div ref={moodboardRef} className="h-full w-full overflow-auto">
          <MoodboardGrid
            panels={panels}
            collectionTitle={formState.title}
            collectionKeywords={formState.keywords}
            collectionAudience={formState.audience}
          />
        </div>
      </main>

      <div className="flex-shrink-0 w-full p-6 border-t border-base-800 bg-base-900/95 backdrop-blur-sm z-20">
        <InputForm
          formState={formState}
          setFormState={setFormState}
          onSubmit={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
