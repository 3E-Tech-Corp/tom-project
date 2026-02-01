export type StrapType = 'strapless' | 'spaghetti' | 'thick' | 'halter' | 'off-shoulder';
export type BackStyle = 'open' | 'closed' | 'low-cut' | 'cross';
export type BaseStyle = 'a-line' | 'mermaid' | 'empire' | 'fit-flare' | 'sheath';
export type Neckline = 'sweetheart' | 'v-neck' | 'scoop' | 'halter' | 'off-shoulder' | 'square';

export interface DressCustomizations {
  length: number;       // 30-100 (percentage of full length)
  strapType: StrapType;
  backStyle: BackStyle;
  color: string;        // hex color
  neckline: Neckline;
}

export interface DressDesign {
  id: number;
  name: string;
  imageUrl?: string;
  baseStyle: BaseStyle;
  customizations: string; // JSON string of DressCustomizations
  isPreset: boolean;
  createdAt: string;
}

export interface UserPhoto {
  id: number;
  userId: number;
  imageUrl: string;
  createdAt: string;
}

export interface ImageUploadResponse {
  url: string;
  fileName: string;
}

export const DEFAULT_CUSTOMIZATIONS: DressCustomizations = {
  length: 75,
  strapType: 'thick',
  backStyle: 'closed',
  color: '#1a1a2e',
  neckline: 'sweetheart',
};

export const PRESET_COLORS = [
  '#1a1a2e', '#722f37', '#2d3436', '#e8d5b7', '#a8e6cf',
  '#dfe6e9', '#fab1a0', '#ffeaa7', '#81ecec', '#a29bfe',
  '#fd79a8', '#e17055', '#00b894', '#6c5ce7', '#fdcb6e',
  '#e84393', '#00cec9', '#0984e3', '#636e72', '#b2bec3',
];

export const STRAP_OPTIONS: { value: StrapType; label: string }[] = [
  { value: 'strapless', label: 'Strapless' },
  { value: 'spaghetti', label: 'Spaghetti' },
  { value: 'thick', label: 'Thick Straps' },
  { value: 'halter', label: 'Halter' },
  { value: 'off-shoulder', label: 'Off-Shoulder' },
];

export const BACK_STYLE_OPTIONS: { value: BackStyle; label: string }[] = [
  { value: 'closed', label: 'Closed' },
  { value: 'open', label: 'Open Back' },
  { value: 'low-cut', label: 'Low Cut' },
  { value: 'cross', label: 'Cross Back' },
];

export const BASE_STYLE_OPTIONS: { value: BaseStyle; label: string }[] = [
  { value: 'a-line', label: 'A-Line' },
  { value: 'mermaid', label: 'Mermaid' },
  { value: 'empire', label: 'Empire' },
  { value: 'fit-flare', label: 'Fit & Flare' },
  { value: 'sheath', label: 'Sheath' },
];

export const NECKLINE_OPTIONS: { value: Neckline; label: string }[] = [
  { value: 'sweetheart', label: 'Sweetheart' },
  { value: 'v-neck', label: 'V-Neck' },
  { value: 'scoop', label: 'Scoop' },
  { value: 'halter', label: 'Halter' },
  { value: 'off-shoulder', label: 'Off-Shoulder' },
  { value: 'square', label: 'Square' },
];
