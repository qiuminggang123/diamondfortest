'use client';

import React, { useEffect, useRef, useState } from 'react';
import PixiStage from './PixiStage';

export default function StageWrapper() {
  const pixiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 挂到window，供全局调用
  useEffect(() => {
    (window as any).getStageSnapshot = () => pixiRef.current?.getStageSnapshot?.();
  }, [pixiRef.current]);

  const handleStageMount = () => {
    setIsLoading(false);
  };

  return (
    <div className="w-full h-[45vh] min-h-[300px] max-h-[500px] relative bg-white overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white">
          <div className="text-gray-500">加载中...</div>
        </div>
      )}
      <PixiStage 
        ref={pixiRef} 
        onMount={handleStageMount} 
      />
    </div>
  );
}