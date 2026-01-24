import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Bead, BeadType, Category, PIXELS_PER_MM } from './types';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_LIBRARY, INITIAL_CATEGORIES } from './initialData';
import { useUIStore } from './uiStore';

interface AppState {
  beads: Bead[];
  library: BeadType[];
  categories: Category[];
  selectedBeadId: string | null;
  circumference: number; 
  totalPrice: number;
  
  addBead: (beadType: BeadType) => void;
  removeBead: (instanceId: string) => void;
  updateBeadPosition: (instanceId: string, x: number, y: number) => void;
  recalculatePositions: () => void;
  selectBead: (instanceId: string | null) => void;
  reset: () => void;
  
  addToLibrary: (item: BeadType) => void;
  removeFromLibrary: (id: string) => void;
  updateLibraryItem: (item: BeadType) => void;

  addCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  updateCategory: (category: Category) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      beads: [],
      library: INITIAL_LIBRARY,
      categories: INITIAL_CATEGORIES,
      selectedBeadId: null,
      circumference: 12.0, 
      totalPrice: 0, 

      addBead: (beadType) => {
        // Validation: Prevent adding if circumference would exceed 25cm
        const currentBeads = get().beads;
        const currentTotalWidth = currentBeads.reduce((sum, b) => sum + b.size, 0);
        const nextTotalWidth = currentTotalWidth + beadType.size;
        
        // Approximate circumfernece in CM = totalWidth (mm) / 10
        // Use a slight buffer (25.1) to allow exact 25.0
        if (nextTotalWidth / 10 > 25.01) {
             useUIStore.getState().showToast('手围已达到最大限制 (25cm)，无法继续添加珠子。', 'error');
             return;
        }

        const newBead: Bead = {
          ...beadType,
          instanceId: uuidv4(),
          x: 0, 
          y: 0,
          rotation: 0
        };

        set((state) => {
          const updatedBeads = [...state.beads, newBead];
          return {
            beads: updatedBeads,
            totalPrice: state.totalPrice + newBead.price,
          };
        });
        get().recalculatePositions();
      },

      removeBead: (instanceId) => {
        set((state) => {
          const beadToRemove = state.beads.find(b => b.instanceId === instanceId);
          if (!beadToRemove) return state;

          const updatedBeads = state.beads.filter(b => b.instanceId !== instanceId);
          return {
            beads: updatedBeads,
            totalPrice: Math.max(0, state.totalPrice - beadToRemove.price),
            selectedBeadId: state.selectedBeadId === instanceId ? null : state.selectedBeadId
          };
        });
        get().recalculatePositions();
      },

      updateBeadPosition: (instanceId, x, y) => {
        set((state) => ({
          beads: state.beads.map(b => 
            b.instanceId === instanceId ? { ...b, x, y } : b
          )
        }));
      },

      recalculatePositions: () => {
        set((state) => {
          const beadCount = state.beads.length;
          if (beadCount === 0) return { circumference: 12.0, beads: [] };

          const totalBeadWidth = state.beads.reduce((sum, b) => sum + b.size, 0);
          
          let newCircumference = Math.max(12, (totalBeadWidth / 10)); 
          newCircumference = parseFloat(newCircumference.toFixed(1)); 
          
          const circumferencePx = newCircumference * 10 * PIXELS_PER_MM;
          const radiusPx = circumferencePx / (2 * Math.PI);
          
          const centerX = 0; 
          const centerY = 0;
          
          // Adaptive Spacing Logic:
          // Distribute angles based on bead size fraction to prevent overlap 
          // and ensure realistic spacing for mixed sizes.
          
          // Start angle offset to center the first bead at the Top (-90 deg)
          const firstBeadSize = state.beads[0].size;
          const firstSpan = (firstBeadSize / totalBeadWidth) * (2 * Math.PI);
          
          // Layout: Start from Bottom-Left (approx 135 deg / 3*PI/4)
          // Direction: Counter-Clockwise (CCW) -> Decreasing Angle
          let baseAngle = Math.PI * 0.75;
          
          if (beadCount === 2) {
            baseAngle = Math.PI * 0.25; // 45 deg (Right-Bottom)
          } else if (beadCount === 3) {
            baseAngle = 75 * (Math.PI / 180); // 75 deg
          } else if (beadCount >= 4) {
            // Formula: 180 - 360/n ensures last bead (index n-1) is at West (180 deg)
            baseAngle = (180 - 360 / beadCount) * (Math.PI / 180);
          }

          let currentAngle = baseAngle + (firstSpan / 2);

          const updatedBeads = state.beads.map((bead) => {
            const sizeFraction = bead.size / totalBeadWidth;
            const angleSpan = sizeFraction * (2 * Math.PI);
            
            // Position center of bead in middle of its span (CCW direction)
            const angle = currentAngle - angleSpan / 2;
            
            // Move start pointer to next segment (CCW)
            currentAngle -= angleSpan;
            
            return {
              ...bead,
               x: centerX + radiusPx * Math.cos(angle),
               y: centerY + radiusPx * Math.sin(angle),
               rotation: angle + Math.PI / 2 
            };
          });

          return {
            circumference: newCircumference,
            beads: updatedBeads
          };
        });
      },

      selectBead: (instanceId) => set({ selectedBeadId: instanceId }),

      reset: () => set({ beads: [], totalPrice: 0, circumference: 12.0, selectedBeadId: null }),
      
      addToLibrary: (item) => set((state) => ({ library: [...state.library, item] })),
      removeFromLibrary: (id) => set((state) => ({ library: state.library.filter(i => i.id !== id) })),
      updateLibraryItem: (item) => set((state) => ({ 
          library: state.library.map(i => i.id === item.id ? item : i) 
      })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      removeCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),
      updateCategory: (category) => set((state) => ({ 
          categories: state.categories.map(c => c.id === category.id ? category : c) 
      })),
    }),
    {
      name: 'diamond-store-v31', // Version bump to restore deleted library items
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        library: state.library, 
        categories: state.categories,
        beads: state.beads, 
        circumference: state.circumference 
      }),
    }
  )
);
