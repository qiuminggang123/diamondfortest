import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Bead, BeadType, Category, PIXELS_PER_MM } from './types';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_LIBRARY, INITIAL_CATEGORIES } from './initialData';
import { useUIStore } from './uiStore';

// Quota exceeded error detection
const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

// Safe localStorage wrapper with automatic cleanup
const safeLocalStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage getItem failed:', error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (isQuotaError(error)) {
        console.warn('localStorage quota exceeded, attempting cleanup...');
        // Try to free space by removing old data
        try {
          // Remove the problematic key first
          localStorage.removeItem(key);
          
          // Clean up old store versions
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey && storageKey.startsWith('diamond-store')) {
              keysToRemove.push(storageKey);
            }
          }
          
          // Remove old versions
          keysToRemove.forEach(k => {
            if (k !== key) localStorage.removeItem(k);
          });
          
          // Try setting the item again
          localStorage.setItem(key, value);
          console.log('Storage cleanup successful');
        } catch (cleanupError) {
          console.error('Storage cleanup failed:', cleanupError);
          // Last resort: clear all diamond storage
          try {
            Object.keys(localStorage).forEach(k => {
              if (k.startsWith('diamond-store')) {
                localStorage.removeItem(k);
              }
            });
            localStorage.setItem(key, value);
          } catch {
            console.error('Unable to save to localStorage - data will not persist');
          }
        }
      } else {
        throw error;
      }
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage removeItem failed:', error);
    }
  }
};

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

// 创建基础状态（无持久化）
const createBaseStore = () => ({
  beads: [],
  savedBeads: [],
  savedDesigns: [],
  library: INITIAL_LIBRARY,
  categories: INITIAL_CATEGORIES,
  selectedBeadId: null,
  circumference: 12.0, 
  savedCircumference: 12.0,
  totalPrice: 0,
  currentDesignId: undefined,
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createBaseStore(),

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
      
      saveDesign: (name) => {
        const designId = uuidv4();
        const designName = name || `设计 ${designId.slice(0, 4)}`;
        const design: SavedDesign = {
          id: designId,
          name: designName,
          beads: get().beads,
          circumference: get().circumference,
        };
        set((state) => ({
          savedDesigns: [...state.savedDesigns, design],
          currentDesignId: designId,
        }));
      },

      setCurrentDesign: (design) => {
        // Calculate price from saved beads
        const price = design.beads.reduce((sum, b) => sum + b.price, 0);
        set({
          beads: design.beads,
          circumference: design.circumference || 12.0,
          totalPrice: price,
          currentDesignId: design.id,
        });
      },

      // 保持向后兼容的 restoreDesign 函数
      restoreDesign: () => {
        // 如果有当前设计ID，则恢复该设计
        const currentState = get();
        if (currentState.currentDesignId) {
          const design = currentState.savedDesigns.find(d => d.id === currentState.currentDesignId);
          if (design) {
            const price = design.beads.reduce((sum, b) => sum + b.price, 0);
            set({
              beads: design.beads,
              circumference: design.circumference || 12.0,
              totalPrice: price
            });
          }
        } else if (currentState.savedBeads.length > 0) {
          // 兼容旧的保存方式
          const price = currentState.savedBeads.reduce((sum, b) => sum + b.price, 0);
          set({
            beads: currentState.savedBeads,
            circumference: currentState.savedCircumference || 12.0,
            totalPrice: price
          });
        }
      },

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
      name: 'diamond-store-v40', // Increment version to clear old data
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => {
        // 只存储必要的数据，避免存储大量图片
        return {
          // 只存储自定义添加的珠子，不存储初始库
          library: state.library.filter(item => 
            !INITIAL_LIBRARY.some(initial => initial.id === item.id)
          ),
          categories: state.categories.filter(cat => 
            !INITIAL_CATEGORIES.some(initial => initial.id === cat.id)
          ),
          savedBeads: state.savedBeads,
          savedCircumference: state.savedCircumference,
          savedDesigns: state.savedDesigns?.map(d => ({
            id: d.id,
            name: d.name,
            circumference: d.circumference,
            beads: d.beads?.map(b => ({
              id: b.id,
              name: b.name,
              type: b.type,
              size: b.size,
              price: b.price,
              // 不存储图片数据
              instanceId: b.instanceId,
              x: b.x,
              y: b.y,
              rotation: b.rotation
            })) || []
          })) || [],
          currentDesignId: state.currentDesignId
        };
      },
      // Migration: Ensure library gets the new textures and merge with persisted custom items
      onRehydrateStorage: (state) => {
        return (hydratedState, error) => {
          if (error) {
            console.error('Storage hydration error:', error);
            return;
          }
          
          if (hydratedState && typeof window !== 'undefined') {
            try {
              // 1. Always start with fresh INITIAL_LIBRARY
              let newLibrary = [...INITIAL_LIBRARY];
              
              // 2. Add custom items from persisted state (if any)
              if (Array.isArray(hydratedState.library) && hydratedState.library.length > 0) {
                // Filter out any items that might conflict with initial library
                const customItems = hydratedState.library.filter(customItem => 
                  !INITIAL_LIBRARY.some(initial => initial.id === customItem.id)
                );
                newLibrary = [...INITIAL_LIBRARY, ...customItems];
              }
              
              // 3. Update active beads if they exist
              let newBeads: Bead[] = [];
              if (Array.isArray(hydratedState.savedBeads) && hydratedState.savedBeads.length > 0) {
                newBeads = hydratedState.savedBeads.map(bead => {
                  const prototype = INITIAL_LIBRARY.find(p => 
                    p.name === bead.name && p.type === bead.type && p.size === bead.size
                  );
                  return prototype ? { ...bead, image: prototype.image } : bead;
                });
              }
              
              // 4. Restore saved designs with proper images
              let newSavedDesigns: SavedDesign[] = [];
              if (Array.isArray(hydratedState.savedDesigns) && hydratedState.savedDesigns.length > 0) {
                newSavedDesigns = hydratedState.savedDesigns.map(design => ({
                  ...design,
                  beads: design.beads?.map(b => {
                    const prototype = INITIAL_LIBRARY.find(p => 
                      p.name === b.name && p.type === b.type && p.size === b.size
                    );
                    return prototype ? { ...b, image: prototype.image } : b;
                  }) || []
                }));
              }
              
              // Apply all updates
              state.library = newLibrary;
              if (newBeads.length > 0) state.beads = newBeads;
              if (newSavedDesigns.length > 0) state.savedDesigns = newSavedDesigns;
              if (hydratedState.currentDesignId) state.currentDesignId = hydratedState.currentDesignId;
              
              console.log('Storage rehydration completed successfully');
            } catch (e) {
              console.error('Error during storage rehydration:', e);
              // Fallback to initial state
              state.library = INITIAL_LIBRARY;
              state.categories = INITIAL_CATEGORIES;
            }
          }
        };
      },
      skipHydration: typeof window === 'undefined'
    }
  )
);
