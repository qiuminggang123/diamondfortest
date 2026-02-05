"use client";

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';
import { useAuthStatus } from '@/lib/useAuthStatus';
import Header from '@/components/Header';

function MyDesignsPage() {
  const { isLoggedIn, status } = useAuthStatus();
  const { savedDesigns, setCurrentDesign, setSavedDesigns } = useStore();
  const router = useRouter();


  // Login verification: redirect to homepage and pop up login box when not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/?showLogin=1');
    }
  }, [status, router]);

  // Load design data
  useEffect(() => {
    if (!isLoggedIn) return; // Only load data when logged in
    fetch('/api/design')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          if (typeof setSavedDesigns === 'function') setSavedDesigns(data.data);
        }
      })
      // eslint-disable-next-line
  }, [isLoggedIn]);

  // If not logged in, do not render page content
  if (!isLoggedIn) {
    return null;
  }

  const handleClick = (design: any) => {
    setCurrentDesign(design);
    // Redirect to homepage to display design
    router.push('/');
  };

  return (
    <main className="flex flex-col h-dvh bg-white overflow-hidden relative shadow-2xl">
      <Header />
      <section className="flex-1 mt-14 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">我的设计</h1>
        {(!savedDesigns || savedDesigns.length === 0) ? (
          <div className="text-gray-400 text-center mt-20">No saved bracelet designs</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {savedDesigns.map((design, idx) => (
              <div
                key={design.id || idx}
                onClick={() => handleClick(design)}
                className="relative cursor-pointer bg-gray-50 rounded-xl shadow hover:shadow-lg transition overflow-hidden border border-gray-100 hover:border-blue-300"
              >
                {/* Delete button */}
                <button
                  className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition"
                  title="Delete Design"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm('Are you sure you want to delete this design?')) return;
                    // Frontend deletion
                    if (typeof setSavedDesigns === 'function') setSavedDesigns(savedDesigns.filter(d => d.id !== design.id));
                    // Backend deletion
                    await fetch(`/api/design?id=${design.id}`, { method: 'DELETE' });
                  }}
                >
                  <span role="img" aria-label="删除">🗑️</span>
                </button>
                <div className="aspect-square bg-white flex items-center justify-center">
                  {design.thumb ? (
                    <img src={design.thumb} alt="Design thumbnail" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-300 text-sm">No thumbnail</div>
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

export default MyDesignsPage;