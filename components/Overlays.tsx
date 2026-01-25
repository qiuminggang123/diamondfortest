'use client';

import { useStore } from '@/lib/store';
import { HelpCircle } from 'lucide-react';

export default function Overlays() {
  const { circumference, totalPrice } = useStore();

  return (
    <div className="absolute top-2 left-0 w-full px-4 flex justify-between items-start pointer-events-none z-40">
      {/* 左侧：使用须知按钮 */}
      <button className="flex items-center gap-1 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full shadow-sm pointer-events-auto">
        <HelpCircle size={14} />
        <span className="font-bold">使用须知</span>
      </button>

      {/* 右侧：信息标签 */}
      <div className="flex gap-2">
        <div className="bg-gray-100/90 backdrop-blur-sm text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow-sm">
          手围：{circumference} 厘米
        </div>
        <div className="bg-gray-100/90 backdrop-blur-sm text-gray-600 text-xs px-3 py-1.5 rounded-lg shadow-sm">
          总价：{totalPrice.toFixed(1)} 元
        </div>
      </div>
    </div>
  );
}
