"use client";

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Header from '@/components/Header';

export default function MyDesignsPage() {
  const { savedDesigns, setCurrentDesign } = useStore();
  const router = useRouter();

  const handleClick = (design: any) => {
    setCurrentDesign(design);
    router.push('/');
  };

  return (
    <main className="flex flex-col h-dvh bg-white overflow-hidden relative max-w-3xl mx-auto shadow-2xl">
      <Header />
      <section className="flex-1 mt-14 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">我的设计</h1>
        {(!savedDesigns || savedDesigns.length === 0) ? (
          <div className="text-gray-400 text-center mt-20">暂无已保存的手串设计</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {savedDesigns.map((design, idx) => (
              <div
                key={design.id || idx}
                onClick={() => handleClick(design)}
                className="cursor-pointer bg-gray-50 rounded-xl shadow hover:shadow-lg transition overflow-hidden border border-gray-100 hover:border-blue-300"
              >
                <div className="aspect-square bg-white flex items-center justify-center">
                  {design.thumb ? (
                    <img src={design.thumb} alt="设计缩略图" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-300 text-sm">无缩略图</div>
                  )}
                </div>
                <div className="p-3 text-center">
                  <div className="font-medium text-gray-700 truncate">{design.name || `设计${idx+1}`}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
