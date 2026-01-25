export interface BeadType {
  id: string;
  name: string;
  image: string;
  type: string;
  size: number; // in mm
  price: number;
  dominantColor?: string; // Optional: Calculated dominant color for UI
}

export interface Category {
  id: string;
  name: string;
}

// 3.78px per mm ~= 96dpi (Standard Screen 1:1)
// Previous value was 5, which made beads look ~30% larger than real life
export const PIXELS_PER_MM = 3.78; 

export interface Bead extends BeadType {
  instanceId: string;
  x?: number; // Calculated position for rendering (optional in store)
  y?: number;
  rotation?: number;
}
