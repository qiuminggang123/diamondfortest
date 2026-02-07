'use client';

import { useState, useMemo } from 'react';
// import { BEAD_LIBRARY } from '@/lib/constants'; // Removed constant import
import { useStore } from '@/lib/store';
import { useUIStore } from '@/lib/uiStore';
import { Search, Trash2, Save, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import { useEffect } from 'react';
import { BeadType } from '@/lib/types';
import Ripple, { RippleArea } from './Ripple';
import DesignConfirmationModal from './DesignConfirmationModal';
import { useAuthStatus } from '@/lib/useAuthStatus';
import { useRouter } from 'next/navigation';

export default function BeadLibrary() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const { isLoggedIn } = useAuthStatus();
    const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);
  

    // Use library from store directly
    const allBeads = useStore((state) => state.library);
    const setLibrary = useStore((state) => state.setLibrary ? state.setLibrary : (lib: any) => {});
        // 保留前端"全部""使用中"分类，其他用后端
        const rawCategories = useStore((state) => state.categories);
        const setCategories = useStore((state) => state.setCategories ? state.setCategories : (cats: any) => {});
        const categories = [
            { id: 'all', name: 'All' },
            { id: 'in-use', name: 'In Use' },
            ...rawCategories.filter(cat => cat.id !== 'all' && cat.id !== 'in-use')
        ];
    const addBead = useStore((state) => state.addBead);
    const reset = useStore((state) => state.reset);
    const activeBeads: BeadType[] = [];//useStore((state) => state.beads); 
    const { showConfirm, showToast, setShowLogin } = useUIStore();

    // Load bead library and category library from API on first mount
    useEffect(() => {
        fetch('/api/bead')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    // 保证每个bead有dominantColor字段（只保留dominantColor，没有就不设，logo逻辑兜底）
                    if (typeof setLibrary === 'function') setLibrary(data.data);
                }
            });
        fetch('/api/category')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    if (typeof setCategories === 'function') setCategories(data.data);
                }
            });
        // eslint-disable-next-line
    }, []);

  // Combined logic: no longer need useEffect to load localStorage manually if store handles it 
  // (In this version, store initializes from INITIAL_LIBRARY. A real app would load persisted data in store)

  const filteredBeads = useMemo(() => {
    let list = allBeads;

    // 1. Filter by Category
    if (activeCategory === 'in-use') {
        // Only show beads that are currently in the workspace (activeBeads)
        const usedIds = new Set(activeBeads.map(b => b.id));
        list = list.filter(bead => usedIds.has(bead.id));
    } else if (activeCategory !== 'all') {
        list = list.filter(bead => bead.type === activeCategory);
    }

    // 2. Filter by Search Query
    if (searchQuery) {
        list = list.filter(bead => bead.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return list;
  }, [activeCategory, searchQuery, allBeads, activeBeads]);

  const handleReset = () => {
      showConfirm({
          title: 'Clear Stage',
          message: 'Are you sure you want to clear the stage and redesign? Current progress will be lost.',
          onConfirm: () => reset()
      });
  };

  const handleSave = () => {
      if (!isLoggedIn) {
          // If user is not logged in, open login modal
          setShowLogin(true);
          return;
      }
      
      if (activeBeads.length === 0) {
          showToast('Please add beads before saving the design', 'error');
          return;
      }
      
      useStore.getState().saveDesign();
      showToast('Design saved successfully!', 'success');
  };
  
  const handleCompleteDesign = () => {
    if (!isLoggedIn) {
      // Consistent with Header component, directly open login modal
      setShowLogin(true);
      return;
    }
    
    if (activeBeads.length === 0) {
      alert('Please add at least one bead to complete the design');
      return;
    }
    
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white border-t border-gray-200">
      {/* Search and Main Actions Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
         <div className="flex gap-3">
             <button 
                onClick={handleReset}
                className="relative overflow-hidden w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
             >
                 <Trash2 size={20} />
                 <Ripple />
             </button>
             <button 
                onClick={handleSave}
                disabled={activeBeads.length === 0}
                className={`relative overflow-hidden flex items-center gap-1 ${
                  activeBeads.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                } px-4 py-2 rounded-lg text-sm font-medium shadow-sm`}
             >
                 <Save size={16} />
                 Save
                 <Ripple color="rgba(255, 255, 255, 0.3)" />
             </button>

         </div>

         <button 
            onClick={handleCompleteDesign}
            disabled={activeBeads.length === 0}
            className={`relative overflow-hidden flex items-center gap-1 ${
              activeBeads.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border border-gray-800 text-gray-800 hover:bg-gray-50'
            } px-4 py-2 rounded-lg text-sm font-medium`}
         >
             <ShoppingCart size={16} />
             Complete Design
             <Ripple />
         </button>
      </div>

      {/* Search Bar (Screenshot shows it inside the library area) */}
      <div className="px-4 py-2 bg-gray-50">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search bead names, e.g. crystal/aquamarine..." 
                className="w-full pl-9 pr-4 py-2 bg-white rounded-full text-sm outline-none border border-transparent focus:border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
      </div>

      {/* Content Area: Left Tabs + Right Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-20 bg-gray-50 flex flex-col overflow-y-auto shrink-0">
             {categories
                .filter(cat => cat.id !== 'in-use' || activeBeads.length > 0)
                .map(cat => (
                <button
                    key={cat.id}
                    className={clsx(
                        "relative overflow-hidden min-h-12.5 flex items-center justify-center py-2 text-xs text-center border-l-4 transition-colors max-w-full px-1 wrap-break-word leading-tight",
                        activeCategory === cat.id ? "border-black bg-white font-bold" : "border-transparent text-gray-500 hover:bg-gray-100"
                    )}
                    onClick={() => setActiveCategory(cat.id)}
                >
                    <span className="text-[10px] w-full line-clamp-2 relative z-10">{cat.name}</span>
                    <Ripple />
                </button>
             ))}
        </div>

        {/* Right Grid */}
        <RippleArea className="flex-1 overflow-y-auto p-3 bg-gray-50/30">
            {isMounted ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filteredBeads.map((bead) => (
                    <motion.div
                        role="button"
                        tabIndex={0}
                        key={bead.id}
                        layoutId={bead.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addBead(bead)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') addBead(bead); }}
                        className="bg-white rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm border border-gray-100 h-full justify-start cursor-pointer focus:outline-none focus:bg-gray-50 transition-colors"
                    >
                        {/* Image or Placeholder */}
                        {bead.image ? (
                            <div className="w-8 h-8 shrink-0 rounded-lg overflow-hidden relative bg-transparent">
                                <Image 
                                    src={bead.image} 
                                    alt={bead.name} 
                                    width={32} 
                                    height={32} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // 如果图片加载失败，可以在这里设置默认图片
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null; // 防止无限循环
                                      target.src = '/images/default-bead.jpg'; // 默认图片
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner flex items-center justify-center relative overflow-hidden">
                                {/* Faux shine */}
                                <div className="absolute top-0.5 left-1.5 w-2.5 h-1 bg-white/40 rounded-full rotate-45 blur-sm" />
                            </div>
                        )}
                        
                        <div className="text-center w-full min-w-0 mt-1">
                            <div className="text-[10px] text-gray-800 line-clamp-2 w-full">{bead.name}</div>
                            <div className="text-[10px] text-gray-400 truncate w-full">{bead.size}mm - £{bead.price}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
            ) : null}
            {isMounted && filteredBeads.length === 0 && (
                <div className="text-center text-gray-400 mt-10 text-sm">珠子太少，再添加些试试。</div>
            )}
        </RippleArea>
      </div>
      <DesignConfirmationModal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setIsConfirmModalOpen(false)} 
        onConfirm={() => {}}
      />
    </div>
  );
}