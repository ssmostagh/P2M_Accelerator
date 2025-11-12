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