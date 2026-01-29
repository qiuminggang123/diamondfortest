import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Bead, BeadType, Category, PIXELS_PER_MM } from './types';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_LIBRARY, INITIAL_CATEGORIES } from './initialData';
import { useUIStore } from './uiStore';

interface SavedDesign {
  id: string;
  name: string;
  beads: Bead[];
  circumference: number;
  thumb?: string;
}

interface AppState {
  beads: Bead[];
  savedBeads: Bead[]; // Deprecated, for migration
  library: BeadType[];
  categories: Category[];
  selectedBeadId: string | null;
  circumference: number; 
  savedCircumference: number;
  totalPrice: number;

  savedDesigns: SavedDesign[];
  currentDesignId?: string;

  addBead: (beadType: BeadType) => void;
  removeBead: (instanceId: string) => void;
  updateBeadPosition: (instanceId: string, x: number, y: number) => void;
  swapBeads: (fromIndex: number, toIndex: number) => void;
  moveBead: (fromIndex: number, toIndex: number) => void;
  recalculatePositions: () => void;
  selectBead: (instanceId: string | null) => void;
  reset: () => void;

  saveDesign: (name?: string) => void; // Save current as new design
  setCurrentDesign: (design: SavedDesign) => void; // Load design to stage

  addToLibrary: (item: BeadType) => void;
  removeFromLibrary: (id: string) => void;
  updateLibraryItem: (item: BeadType) => void;
  setLibrary?: (items: BeadType[]) => void;

  addCategory: (category: Category) => void;
  removeCategory: (id: string) => void;
  updateCategory: (category: Category) => void;
  setCategories?: (items: Category[]) => void;
  setSavedDesigns?: (items: any[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      beads: [],
      savedBeads: [],
      savedDesigns: [],
      library: INITIAL_LIBRARY,
      categories: INITIAL_CATEGORIES,
      selectedBeadId: null,
      circumference: 12.0, // 默认12cm
      savedCircumference: 12.0,
      totalPrice: 0, // 默认0元


      addBead: (beadType) => {
        // Validation: Prevent adding if circumference would exceed 25cm
        const currentBeads = get().beads;
        const currentTotalWidth = currentBeads.reduce((sum, b) => sum + b.size, 0);
        const nextTotalWidth = currentTotalWidth + beadType.size;
        if (nextTotalWidth / 10 > 25.01) {
             useUIStore.getState().showToast('手围已达到最大限制 (25cm)，无法继续添加珠子。', 'error');
             return;
        }
        // dominantColor优先用前端canvas同步计算
        function getDominantColorSync(bead) {
          if (bead.dominantColor) return bead.dominantColor;
          if (bead.image && typeof window !== 'undefined') {
            try {
              const img = document.createElement('img');
              img.src = bead.image;
              const canvas = document.createElement('canvas');
              canvas.width = 10; canvas.height = 10;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, 10, 10);
              const data = ctx.getImageData(0, 0, 10, 10).data;
              let r=0,g=0,b=0;
              for(let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];}
              r=Math.round(r/(data.length/4));g=Math.round(g/(data.length/4));b=Math.round(b/(data.length/4));
              return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
            } catch {}
          }
          return undefined;
        }
        const newBead: Bead = {
          ...beadType,
          dominantColor: getDominantColorSync(beadType),
          instanceId: uuidv4(),
          x: 0, y: 0, rotation: 0
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

      swapBeads: (fromIndex, toIndex) => {
        set((state) => {
            const newBeads = [...state.beads];
            if (fromIndex < 0 || fromIndex >= newBeads.length || toIndex < 0 || toIndex >= newBeads.length) return state;
            
            const temp = newBeads[fromIndex];
            newBeads[fromIndex] = newBeads[toIndex];
            newBeads[toIndex] = temp;
            return { beads: newBeads };
        });
        get().recalculatePositions();
      },

      moveBead: (fromIndex, toIndex) => {
        set((state) => {
            const newBeads = [...state.beads];
            // Bounds check
            if (fromIndex < 0 || fromIndex >= newBeads.length || toIndex < 0 || toIndex >= newBeads.length) return state;
            if (fromIndex === toIndex) return state;

            // Remove from old position
            const [movedBead] = newBeads.splice(fromIndex, 1);
            // Insert at new position
            newBeads.splice(toIndex, 0, movedBead);

            return { beads: newBeads };
        });
        get().recalculatePositions();
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
      

      saveDesign: async (name) => {
        const state = get();
        // 获取舞台快照
        let thumb = '';
        if (typeof window !== 'undefined' && typeof (window as any).getStageSnapshot === 'function') {
          thumb = (window as any).getStageSnapshot() || '';
        }
        const payload = {
          name: name || `设计${state.savedDesigns.length + 1}`,
          beads: state.beads.map(b => ({
            id: b.id,
            x: b.x,
            y: b.y,
            rotation: b.rotation,
          })),
          circumference: state.circumference,
          thumb,
        };
        const res = await fetch('/api/design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          // 保存成功后刷新设计列表
          const data = await res.json();
          if (typeof get().setSavedDesigns === 'function') {
            // 重新拉取设计列表
            fetch('/api/design').then(r => r.json()).then(d => {
              if (d.success && Array.isArray(d.data)) get().setSavedDesigns!(d.data);
            });
          }
          // 设置当前设计ID
          set({ currentDesignId: data.data.id });
        }
      },

      setCurrentDesign: (design) => set(() => {
        // dominantColor优先用前端canvas同步计算
        function getDominantColorSync(bead) {
          if (bead.dominantColor) return bead.dominantColor;
          if (bead.image && typeof window !== 'undefined') {
            try {
              const img = document.createElement('img');
              img.src = bead.image;
              const canvas = document.createElement('canvas');
              canvas.width = 10; canvas.height = 10;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, 10, 10);
              const data = ctx.getImageData(0, 0, 10, 10).data;
              let r=0,g=0,b=0;
              for(let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];}
              r=Math.round(r/(data.length/4));g=Math.round(g/(data.length/4));b=Math.round(b/(data.length/4));
              return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
            } catch {}
          }
          return undefined;
        }
        const beads = (design.beads || []).map((b, idx) => ({
          ...b,
          dominantColor: getDominantColorSync(b),
          instanceId: b.instanceId || b.id || `bead-${idx}`,
          price: typeof b.price === 'number' ? b.price : 0,
          image: b.image || '',
          type: b.type || '',
          x: typeof b.x === 'number' ? b.x : 0,
          y: typeof b.y === 'number' ? b.y : 0,
          rotation: typeof b.rotation === 'number' ? b.rotation : 0,
        }));
        const price = beads.reduce((sum, b) => sum + (b.price || 0), 0);
        return {
          beads,
          circumference: design.circumference,
          totalPrice: price,
          currentDesignId: design.id,
        };
      }),

        addToLibrary: (item) => set((state) => ({ library: [...state.library, item] })),
        removeFromLibrary: (id) => set((state) => ({ library: state.library.filter(i => i.id !== id) })),
        updateLibraryItem: (item) => set((state) => ({ 
          library: state.library.map(i => i.id === item.id ? item : i) 
        })),
        setLibrary: (items) => set(() => ({ library: items })),

        addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
        removeCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),
        updateCategory: (category) => set((state) => ({ 
          categories: state.categories.map(c => c.id === category.id ? category : c) 
        })),
        setSavedDesigns: (items) => set(() => ({ savedDesigns: items })),
        setCategories: (items) => set(() => ({ categories: items })),
    }),
    {
      name: 'diamond-store-v39', // Revert to semi-transparency and external caustics
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        library: state.library,
        categories: state.categories,
        savedBeads: state.savedBeads,
        savedCircumference: state.savedCircumference,
        // savedDesigns只持久化必要字段，不存thumb
        savedDesigns: state.savedDesigns?.map(d => ({
          id: d.id,
          name: d.name,
          circumference: d.circumference,
          // beads: d.beads?.length  // 如需可只存长度
        })),
        currentDesignId: state.currentDesignId,
      }),
      // Migration: Ensure library and existing beads get the new textures
      onRehydrateStorage: (state) => {
        return (hydratedState, error) => {
           if (hydratedState) {
               // 1. Force Reset Library to code-defined INITIAL_LIBRARY to get new Textures
               // We only keep custom items (if any id is not in initial set)
               const initialIds = new Set(INITIAL_LIBRARY.map(b => b.id));
               const customItems = hydratedState.library ? hydratedState.library.filter(b => !initialIds.has(b.id)) : [];
               
               // Merge: New Initial Library + User Custom Items
               const newLibrary = [...INITIAL_LIBRARY, ...customItems];
               
               // 2. Update active 'beads' on stage if they match standard types
               // This fixes "old beads on stage" having old textures
               const newBeads = hydratedState.beads ? hydratedState.beads.map(bead => {
                   // Find matching prototype in new library
                   // Note: 'bead.id' is a uuid instance, we need to match by 'bead.name' + 'bead.type' or similar if we don't store prototypeId
                   // Since we don't store prototypeId strictly, we can try to match by name/type signature
                   const prototype = INITIAL_LIBRARY.find(p => p.name === bead.name && p.type === bead.type && p.size === bead.size);
                   if (prototype) {
                       return { ...bead, image: prototype.image }; // Update texture
                   }
                   return bead;
               }) : [];

               // Apply updates
               state.library = newLibrary;
               if (newBeads.length > 0) state.beads = newBeads;
               
               // Also update Saved Designs
               const newSavedBeads = hydratedState.savedBeads ? hydratedState.savedBeads.map(bead => {
                   const prototype = INITIAL_LIBRARY.find(p => p.name === bead.name && p.type === bead.type && p.size === bead.size);
                   return prototype ? { ...bead, image: prototype.image } : bead;
               }) : [];
               if (newSavedBeads.length > 0) state.savedBeads = newSavedBeads;
           }
        };
      }
    }
  )
);
