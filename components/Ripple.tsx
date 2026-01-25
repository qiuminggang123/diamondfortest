'use client';

import React, { useState, useEffect, MouseEvent } from 'react';

export default function Ripple({ color = 'rgba(0, 0, 0, 0.3)' }: { color?: string }) {
  const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

  const addRipple = (event: MouseEvent<HTMLDivElement>) => {
    const container = event.currentTarget.getBoundingClientRect();
    const size = Math.max(container.width, container.height);
    const x = event.clientX - container.left - size / 2;
    const y = event.clientY - container.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1200);
  };

  return (
    <span
      className="absolute inset-0 overflow-hidden rounded-[inherit]"
      onMouseDown={addRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            backgroundColor: color,
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </span>
  );
}

export function RippleArea({ children, className = '', color = 'rgba(0, 0, 0, 0.3)' }: { children: React.ReactNode; className?: string; color?: string }) {
  const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const size = 100; // Fixed size for area ripples to avoid huge ripples
    const x = event.clientX - rect.left + container.scrollLeft - size / 2;
    const y = event.clientY - rect.top + container.scrollTop - size / 2;

    const newRipple = { x, y, size, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1200);
  };

  return (
    <div className={`relative ${className}`} onMouseDown={addRipple}>
      {children}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-50">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full animate-ripple"
            style={{
              backgroundColor: color,
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </div>
    </div>
  );
}
