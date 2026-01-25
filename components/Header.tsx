import { ChevronLeft, MoreHorizontal, Minus, CircleDot, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white z-50 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
         {/* 返回按钮 */}
        <Link href="#" className="p-2" title="返回">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Link>
      </div>
      
      <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'var(--font-cinzel), serif' }}>AURA LOOP</h1>
      
      <div className="flex items-center gap-2">
        {/* 进入管理后台 */}
        <Link href="/admin" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200" title="管理后台">
          <Settings className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
        <button className="p-2 bg-gray-100 rounded-full" title="关于">
           <CircleDot className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
