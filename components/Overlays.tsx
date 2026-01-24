'use client';

import { useStore } from '@/lib/store';
import { HelpCircle } from 'lucide-react';

export default function Overlays() {
  const { circumference, totalPrice } = useStore();

  return (
    <div className="absolute top-2 left-0 w-full px-4 flex justify-between items-start pointer-events-none z-40">
      {/* Left: Instructions */}
      <button className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full shadow-sm pointer-events-auto">
        <HelpCircle size={14} />
        <span className="font-bold">使用须知</span>
      </button>

      {/* Right: Info Pills */}
      <div className="flex gap-2">
        <div className="bg-gray-100/90 backdrop-blur-sm text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow-sm">
          手围 - {circumference}cm
        </div>
        <div className="bg-gray-100/90 backdrop-blur-sm text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow-sm">
          总价格: {totalPrice.toFixed(1)} 元
        </div>
      </div>
    </div>
  );
}
