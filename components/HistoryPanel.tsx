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


import React from 'react';
import { HistoryGroup, HistoryImage } from '../types';

interface HistoryPanelProps {
  history: HistoryGroup[];
  onSelect: (image: HistoryImage) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg flex flex-col flex-grow min-h-0 transition-colors duration-200">
      <h2 className="text-lg font-bold mb-2 text-purple-600 dark:text-purple-300 flex-shrink-0">Generation History</h2>
      <div className="overflow-y-auto flex-grow -mr-2 pr-2">
        {history.length === 0 ? (
          <div className="text-center text-gray-500 pt-4">
            <p className="text-sm">Your generated images will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 truncate">
                  {group.type}
                  {group.prompt && <span className="text-gray-500 font-normal italic ml-2">"{group.prompt}"</span>}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                  {group.images.map((image) => (
                    <div
                      key={image.id}
                      className="aspect-w-1 aspect-h-1 cursor-pointer group"
                      onClick={() => onSelect(image)}
                    >
                      <img
                        src={image.imageUrl}
                        alt={`Generated design ${image.id}`}
                        className="w-full h-full object-cover rounded-md transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
