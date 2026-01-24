'use client';

import dynamic from 'next/dynamic';

const PixiStage = dynamic(() => import('./PixiStage'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">Loading Stage...</div>
});

export default function StageWrapper() {
  return (
    <div className="w-full h-[45vh] min-h-[300px] max-h-[500px] relative bg-white">
      <PixiStage />
    </div>
  );
}
