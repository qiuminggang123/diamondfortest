import { ChevronLeft, MoreHorizontal, Minus, CircleDot } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white z-50 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
         {/* Back Button */}
        <Link href="#" className="p-2">
            <ChevronLeft className="w-6 h-6 text-black" />
        </Link>
      </div>
      
      <h1 className="text-lg font-bold text-gray-800">养个珠子</h1>
      
      <div className="flex items-center gap-2">
         {/* Options */}
         <button className="p-2 bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
         </button>
         <div className="w-[1px] h-4 bg-gray-300 mx-1"></div>
         <button className="p-2 bg-gray-100 rounded-full">
             <CircleDot className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}
