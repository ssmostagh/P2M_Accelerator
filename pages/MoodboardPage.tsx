import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { InputForm } from '../components/InputForm';
import { MoodboardGrid } from '../components/MoodboardGrid';
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

    const colorPrompt = `Generate a cohesive color palette of 8 colors for a fashion collection with the theme '${title}' and keywords '${keywords}'.

CRITICAL - MATCH THE THEME'S COLOR INTENSITY:
Carefully analyze the theme and keywords to determine the appropriate color saturation and tone:

IF the theme includes words like: boho, romantic, garden, airy, soft, ethereal, dreamy, coastal, pastel, gentle, delicate, spring, summer
→ USE ONLY light, desaturated, soft colors with LOW saturation (pastel pinks, sage greens, soft blues, ivory, cream, pale lavender, dusty rose, light terracotta)
→ AVOID bold, saturated, or deep colors entirely

IF the theme includes words like: dark academia, gothic, moody, noir, dramatic, mysterious, autumn, winter
→ USE deep, rich, dark tones with high saturation (burgundy, forest green, navy, charcoal, deep brown, maroon, midnight blue)

IF the theme includes words like: urban, street, contemporary, modern, edgy, industrial
→ USE muted neutrals or bold primary colors (grays, blacks, whites, bold red, electric blue)

IF the theme includes words like: minimalist, scandinavian, clean, simple, refined
→ USE mostly neutrals (whites, beiges, grays, black) with one subtle accent

IF the theme includes words like: vibrant, maximalist, bold, colorful, eclectic, tropical
→ USE bold, saturated, high-energy colors (bright orange, hot pink, electric blue, sunny yellow)

The palette MUST authentically reflect the collection's aesthetic and color intensity. Do NOT use saturated colors for soft/romantic/boho themes.

For each color, provide: 1) An accurate, real Pantone color code (e.g., "PANTONE 19-4052 TCX" or "PANTONE 16-1546 TPX"), and 2) The corresponding hex code. Use only real, existing Pantone colors from the Pantone Matching System.`;
    const figureBasePrompt = `A single, professional, high-quality fashion photograph. Theme: '${title}'. Keywords: ${keywords}. IMPORTANT: Show only ONE subject or scene. Do NOT create a grid, collage, or multiple images. Do NOT include text or labels. Audience: ${audience}.`;
    const nonFigureBasePrompt = `A single, professional, high-quality photograph. Theme: '${title}'. Keywords: ${keywords}. IMPORTANT: Show only ONE subject or scene. Do NOT create a grid, collage, or multiple images. Do NOT include text or labels. Do NOT include people or models in the image. Focus on the subject matter. Audience: ${audience}.`;

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
          // If this is a figure prompt, use figureBasePrompt and append audience constraints
          const isFigurePrompt = FIGURE_PROMPTS.includes(modifier);
          const fullPrompt = isFigurePrompt
            ? `${figureBasePrompt} ${modifier} IMPORTANT: ${audienceConstraint}`
            : `${nonFigureBasePrompt} ${modifier}`;

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
          showExportButton={panels.length > 0}
          onExport={handleExportMoodboard}
          isExporting={isExporting}
        />
      </div>
    </div>
  );
}
