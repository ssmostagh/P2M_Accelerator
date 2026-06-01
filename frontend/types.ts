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

export interface Fabric {
  id: number;
  name: string;
  imageUrl: string;
  prompt: string;
}

export enum DesignView {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export enum HistoryActionType {
  INITIAL = 'Initial Generation',
  EDIT = 'Image Edit',
  FABRIC = 'Fabric Change',
  BACK_VIEW = 'Back View Generation',
}

export interface HistoryImage {
  id: string;
  imageUrl: string;
}

export interface HistoryGroup {
  id: string;
  type: HistoryActionType;
  prompt?: string;
  images: HistoryImage[];
}

// Moodboard Types
export interface PanelLayout {
  id: number;
  gridClass: string;
  type: 'image' | 'color';
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface ImagePanelData {
  id: number;
  type: 'image';
  prompt: string;
}

export interface PantoneColor {
  name: string;
  code: string; // hex code
}

export interface ColorPanelData {
  id: number;
  type: 'color';
  color: PantoneColor;
  prompt: string; // The prompt used to generate the palette
}

export type PanelData = ImagePanelData | ColorPanelData;

export interface FormState {
  title: string;
  keywords: string;
  audience: string;
}

// Tech Pack Types
export interface TechPackUploadedImage {
  file: File;
  dataUrl: string;
}

export interface TechPackGeneratedImages {
  renderingCombined: string | null;  // Single image with front + back renderings (null during workflow)
  flatCombined: string;              // Single image with front + back technical flats
  annotatedOverlay?: string;         // Annotated tech pack with measurement callouts
  annotations?: string[];            // Array of annotation descriptions
  flatCombinedSvg?: string;          // SVG vector drawing output
}