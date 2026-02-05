'use client';

import { useUIStore } from '@/lib/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingModal() {
  const { loadingModal, hideLoading } = useUIStore();

  return (
    <AnimatePresence>
      {loadingModal.visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="loading-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 pointer-events-auto"
            onClick={hideLoading}
          />
          
          {/* Modal */}
          <motion.div
            key="loading-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div 
              className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4">
                {/* Spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent flex items-center justify-center"
                >
                  <Loader2 className="w-6 h-6 text-blue-500" />
                </motion.div>
                
                {/* Message */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    正在处理
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {loadingModal.message}
                  </p>
                </div>
                
                {/* Progress Bar */}
                {loadingModal.progress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingModal.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}