
export enum DesignView {
  FRONT = 'front',
  BACK = 'back',
}

export enum HistoryActionType {
  INITIAL = 'Initial Generation',
  FABRIC = 'Fabric Change',
  EDIT = 'Freeform Edit',
  BACK_VIEW = 'Back View Generation',
}

export interface HistoryImage {
  id: string;
  imageUrl: string;
}

export interface HistoryGroup {
  id:string;
  type: HistoryActionType;
  prompt?: string;
  images: HistoryImage[];
}

export interface Fabric {
  id: number;
  name: string;
  imageUrl: string;
  prompt: string;
}
