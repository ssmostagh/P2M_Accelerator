
import { ImageCard } from './ImageCard.tsx';
import { ColorCard } from './ColorCard.tsx';
import { PANEL_LAYOUTS } from '../constants/moodboardConstants';
import type { PanelData } from '../types';

interface MoodboardGridProps {
  panels: PanelData[];
  collectionTitle?: string;
  collectionKeywords?: string;
  collectionAudience?: string;
}

export function MoodboardGrid({ panels, collectionTitle, collectionKeywords, collectionAudience }: MoodboardGridProps) {
  // Show empty grid layout if no panels generated yet
  if (panels.length === 0) {
    return (
      <div className="grid grid-cols-14 grid-rows-8 gap-4 h-full w-full" style={{ maxHeight: '100%' }}>
        {PANEL_LAYOUTS.map(layout => (
          <div
            key={layout.id}
            className={`${layout.gridClass} ${
              layout.type === 'color' ? 'bg-gray-800' : 'bg-gray-800/50'
            } rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center`}
          >
            {layout.type === 'color' ? (
              <span className="text-gray-600 text-xs">Color</span>
            ) : (
              <span className="text-gray-600 text-xs">Image</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-14 grid-rows-8 gap-4 animate-fade-in h-full w-full" style={{ maxHeight: '100%' }}>
      {panels.map(panel => {
        const layout = PANEL_LAYOUTS.find(l => l.id === panel.id);
        if (!layout) return null;

        switch (panel.type) {
          case 'image':
            return (
              <ImageCard
                key={panel.id}
                panelData={panel}
                layout={layout}
                collectionTitle={collectionTitle}
                collectionKeywords={collectionKeywords}
                collectionAudience={collectionAudience}
              />
            );
          case 'color':
            return <ColorCard key={panel.id} panelData={panel} layout={layout} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
