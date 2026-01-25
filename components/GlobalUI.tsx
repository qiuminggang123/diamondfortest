'use client';

import { useStore } from '@/lib/store';
import { useUIStore } from '@/lib/uiStore';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

export default function GlobalUI() {
  const { toast, confirmDialog, hideToast, hideConfirm } = useUIStore();
  const restoreDesign = useStore((state) => state.restoreDesign);

  // Restore saved design on load (Manual Save behavior)
  useEffect(() => {
    restoreDesign();
  }, [restoreDesign]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-center">
      
      {/* Toast Notification (Top Center) */}
      <div className="absolute top-10 w-full flex justify-center px-4">
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={clsx(
                "px-6 py-3 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto min-w-[200px] justify-center backdrop-blur-sm",
                toast.type === 'success' && "bg-green-500/90 text-white",
                toast.type === 'error' && "bg-red-500/90 text-white",
                toast.type === 'info' && "bg-gray-800/90 text-white"
              )}
            >
               {toast.type === 'success' && <CheckCircle size={18} />}
               {toast.type === 'error' && <AlertCircle size={18} />}
               {toast.type === 'info' && <Info size={18} />}
               <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog (Center) */}
      <AnimatePresence>
        {confirmDialog.visible && (
          <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideConfirm}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
            />
        )}
        {confirmDialog.visible && (
            <motion.div
               key="modal"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white rounded-2xl shadow-xl w-[90%] max-w-sm p-6 relative pointer-events-auto z-10"
            >
                <button onClick={hideConfirm} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {confirmDialog.message}
                </p>
                
                <div className="flex gap-3">
                    <button
                        onClick={confirmDialog.onCancel}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={confirmDialog.onConfirm}
                        className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800 active:bg-gray-900 transition-colors shadow-sm"
                    >
                        确认
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
