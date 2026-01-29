'use client';

import React, { useEffect, useRef } from 'react';
import PixiStage from './PixiStage';

export default function StageWrapper() {
  const pixiRef = useRef<any>(null);
  // 挂到window，供全局调用
  useEffect(() => {
    (window as any).getStageSnapshot = () => pixiRef.current?.getStageSnapshot?.();
  }, [pixiRef.current]);
  return (
    <div className="w-full h-[45vh] min-h-[300px] max-h-[500px] relative bg-white">
      <PixiStage ref={pixiRef} />
    </div>
  );
}
