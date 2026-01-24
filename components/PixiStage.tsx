'use client';

import { Stage, Container, Sprite, Graphics, useTick } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useStore } from '@/lib/store';
import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { Bead, PIXELS_PER_MM } from '@/lib/types';

// Z-Index Layers
const Z_SHADOW = 10;
const Z_STRING = 20;
const Z_BODY = 30;

// Unified Component controlling both Shadow and Body
// This ensures they share the exact same 'position' state, eliminating synchronization jitter.
const AnimatedBead = memo(({ bead, radius, stageWidth, stageHeight, globalScale }: { bead: Bead; radius: number, stageWidth: number, stageHeight: number, globalScale: number }) => {
    const containerRef = useRef<PIXI.Container>(null);
    
    const startSpawnY = stageHeight / 2 + 100; 
    
    // Fixed Spawn Position (Stage Bottom-Left):
    // Beads fly in from the bottom-left corner of the screen.
    // They fly fast initially and slow down as they reach their target (Lerp).
    // Adjust spawn point based on scale so it always starts off-screen or at edge relative to the zoomed container
    const spawnX = (-stageWidth / 2 + 50) / globalScale; 
    const spawnY = (stageHeight / 2 - 50) / globalScale; 
    
    // Joint Position State
    const [position, setPosition] = useState({ x: spawnX, y: spawnY }); 
    const [visualRotation, setVisualRotation] = useState(0);

    const targetPos = { x: bead.x || 0, y: bead.y || 0 };
    const removeBead = useStore((state) => state.removeBead);
    
    const isDragging = useRef(false);
    const [cursor, setCursor] = useState('pointer');

    // Drag State
    const [dragPosition, setDragPosition] = useState<{x:number, y:number} | null>(null);

    // Physics / Animation Loop
    useTick((delta) => {
        if (isDragging.current || dragPosition) return;

        // "Cannon Shot" Logic (Restored to Smooth Easing)
        // Simple linear interpolation to the target slot.
        const speed = 0.15; // Snappy speed

        const dx = targetPos.x - position.x;
        const dy = targetPos.y - position.y;
        
        const targetRot = bead.rotation || 0;

        // If very close, snap to exact position
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            if (position.x !== targetPos.x || position.y !== targetPos.y) {
                 setPosition({ x: targetPos.x, y: targetPos.y });
            }
            if (visualRotation !== targetRot) {
                 setVisualRotation(targetRot);
            }
        } else {
             // Fly towards target
             const nextX = position.x + dx * speed;
             const nextY = position.y + dy * speed;

             setPosition({ x: nextX, y: nextY });
             
             // UNIFIED TANGENT ALIGNMENT: 
             // Always align strictly to the tangent of the circle centered at (0,0) passing through current position.
             // This ensures smooth, continuous rotation adjustment during both flight and loop placement.
             const dynamicRot = Math.atan2(nextY, nextX) + Math.PI / 2;
             setVisualRotation(dynamicRot);
        }
    });

    // Derived Render State
    const renderX = dragPosition ? dragPosition.x : position.x;
    const renderY = dragPosition ? dragPosition.y : position.y;
    // When dragging, keep visual rotation; otherwise use animated rotation
    const renderRotation = visualRotation;
    
    const beadRadiusPx = (bead.size * PIXELS_PER_MM) / 2;
  
    // --- Graphics Draw Functions ---
    const drawShadow = useCallback((g: PIXI.Graphics) => {
      g.clear();
      // 1. Base Shadow (Dark, Soft)
      g.beginFill(0x000000, 0.4); 
      g.drawEllipse(0, 0, beadRadiusPx * 0.9, beadRadiusPx * 0.7);
      g.endFill();
    }, [beadRadiusPx]);

    // CAUSTIC EFFECT: A bright focused light spot inside the shadow
    // Simulates light passing through the glass bead and focusing on the table.
    const drawCaustic = useCallback((g: PIXI.Graphics) => {
      g.clear();
      // Bright "Caustic" Core
      g.beginFill(0xFFFFFF, 0.3); // Semi-transparent white
      g.drawEllipse(0, 0, beadRadiusPx * 0.4, beadRadiusPx * 0.3);
      g.endFill();
    }, [beadRadiusPx]);
  
    const drawHighlight = useCallback((g: PIXI.Graphics) => {
      g.clear();
      
      // 1. Fresnel / Rim Light (Edge Definition)
      // Adds a subtle glass-like edge so it doesn't look like a flat sticker
      g.lineStyle(1, 0xFFFFFF, 0.3);
      g.drawCircle(0, 0, beadRadiusPx);
      g.lineStyle(0); // Reset line

      // 2. Main Specular Highlight (Top-Left)
      // Direct reflection of the light source
      g.beginFill(0xFFFFFF, 0.2); // Soft Glow
      g.drawCircle(beadRadiusPx * 0.35, -beadRadiusPx * 0.35, beadRadiusPx * 0.25);
      g.endFill();
      
      g.beginFill(0xFFFFFF, 0.9); // Sharp Core
      g.drawCircle(beadRadiusPx * 0.35, -beadRadiusPx * 0.35, beadRadiusPx * 0.1);
      g.endFill();

      // 3. Secondary Internal Reflection (Bottom-Right)
      // Light enters top-left, refracts, and hits the bottom-right inner wall.
      // This is crucial for the "transparent gem" look.
      g.beginFill(0xFFFFFF, 0.15); // Broad soft light
      // Draw a crescent-like shape or soft circle at bottom right
      g.drawCircle(-beadRadiusPx * 0.25, beadRadiusPx * 0.25, beadRadiusPx * 0.25);
      g.endFill();
      
      // Add a smaller, brighter core for the internal bounce
      g.beginFill(0xFFFFFF, 0.4); 
      g.drawEllipse(-beadRadiusPx * 0.25, beadRadiusPx * 0.28, beadRadiusPx * 0.15, beadRadiusPx * 0.1);
      g.endFill();

    }, [beadRadiusPx]);
  
    // --- Interaction Handlers ---
    const onDragStart = (event: any) => {
      setCursor('move');
      const startPos = event.data.getLocalPosition(containerRef.current?.parent);
      setDragPosition(startPos);
    };
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onDragEnd = (event: any) => {
      setCursor('pointer');
      const parent = containerRef.current?.parent;
      if (parent && dragPosition) {
          const dropPos = event.data.getLocalPosition(parent);
          // Calculate distance from center (0,0 is center in parent container)
          const dist = Math.sqrt(dropPos.x * dropPos.x + dropPos.y * dropPos.y);
          // If dragged too far from the bracelet ring, remove it
          if (Math.abs(dist - radius) > beadRadiusPx * 2) { 
              removeBead(bead.instanceId);
          }
      }
      setDragPosition(null);
    };
  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onDragMove = (event: any) => {
      if (dragPosition) {
        const newPos = event.data.getLocalPosition(containerRef.current?.parent);
        setDragPosition(newPos);
      }
    };

    // Stable filter instance
    const STABLE_SHADOW_FILTER = useMemo(() => [new PIXI.BlurFilter(5)], []); // Reduced blur for lighter, cleaner look
    const STABLE_CAUSTIC_FILTER = useMemo(() => [new PIXI.BlurFilter(2)], []); // Sharp blur for focused light
  
    return (
      <>
        {/* SHADOW LAYER (Moves in sync with Body) */}
        <Container
            position={[renderX, renderY]}
            zIndex={Z_SHADOW}
        >
            {/* Dark Cast Shadow */}
            <Graphics
                draw={drawShadow}
                filters={STABLE_SHADOW_FILTER} 
                x={-beadRadiusPx * 0.2} 
                y={beadRadiusPx * 0.25} 
            />
             {/* Caustic Light Spot (Bright Core) */}
            <Graphics
                draw={drawCaustic}
                filters={STABLE_CAUSTIC_FILTER}
                blendMode={PIXI.BLEND_MODES.ADD} // Additive blending makes it glow
                x={-beadRadiusPx * 0.2} 
                y={beadRadiusPx * 0.25} 
            />
        </Container>

        {/* BODY LAYER (Interactive) */}
        <Container 
            ref={containerRef}
            position={[renderX, renderY]}
            zIndex={Z_BODY}
            interactive={true}
            cursor={cursor}
            pointerover={() => !dragPosition && setCursor('pointer')}
            pointerout={() => !dragPosition && setCursor('default')}
            pointerdown={onDragStart}
            pointerup={onDragEnd}
            pointerupoutside={onDragEnd}
            pointermove={onDragMove}
        >
            {bead.image && (
                <Container>
                    <Sprite
                        image={bead.image}
                        anchor={0.5}
                        width={beadRadiusPx * 2}
                        height={beadRadiusPx * 2}
                        rotation={renderRotation}
                    />
                    <Graphics draw={drawHighlight} />
                </Container>
            )}
        </Container>
      </>
    );
});

AnimatedBead.displayName = 'AnimatedBead';

// StringLoop: Manages the animation of the string radius
const StringLoop = ({ targetRadius }: { targetRadius: number }) => {
    // Start with targetRadius but animate towards it if it changes
    const [currentRadius, setCurrentRadius] = useState(targetRadius);
    
    // Physics / Animation Loop for String scaling
    useTick(() => {
         const speed = 0.15; // Match bead speed
         
         const diff = targetRadius - currentRadius;
         // If difference is significant, interpolate
         if (Math.abs(diff) > 0.5) {
             setCurrentRadius(prev => prev + diff * speed);
         } else if (currentRadius !== targetRadius) {
             setCurrentRadius(targetRadius);
         }
    });

    const drawString = useCallback((g: PIXI.Graphics) => {
         g.clear();
         // Bright Silver String
         g.lineStyle(3, 0xE8E8E8, 1); 
         g.drawCircle(0, 0, currentRadius);
    }, [currentRadius]);

    return (
        <Graphics
            zIndex={Z_STRING}
            draw={drawString}
        />
    )
}

// Separate Inner Content component to utilize useStore and pass props
const PixiContent = ({ width, height, userZoom = 1 }: { width: number, height: number, userZoom?: number }) => {
    const { beads, circumference } = useStore();
    const targetRadius = (circumference * 10 * PIXELS_PER_MM) / (2 * Math.PI); 
    
    // Auto-Scaling Logic
    const margin = 60; // Padding from screen edge
    const maxBeadSize = useMemo(() => beads.length > 0 ? Math.max(...beads.map(b => b.size)) : 10, [beads]);
    const braceletOuterRadius = targetRadius + (maxBeadSize * PIXELS_PER_MM / 2);
    
    const maxViewableRadius = Math.min(width, height) / 2 - margin;
    const autoScale = braceletOuterRadius > maxViewableRadius ? maxViewableRadius / braceletOuterRadius : 1;
    
    // Combine auto-fit scale with user zoom
    const finalScale = autoScale * userZoom;

    return (
        <Container x={width / 2} y={height / 2} sortableChildren={true} scale={finalScale}>
            {/* 1. BEADS */}
            {beads.map((bead) => (
                <AnimatedBead
                    key={bead.instanceId} 
                    bead={bead} 
                    radius={targetRadius} 
                    stageWidth={width}
                    stageHeight={height}
                    globalScale={finalScale}
                />
            ))}

             {/* 2. STRING - Animated String Loop */}
            <StringLoop targetRadius={targetRadius} />

        </Container>
    );
};

const BraceletStage = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [userZoom, setUserZoom] = useState(1);
    
    // Auto-Reset Zoom when Bead Count Increases
    const beadCount = useStore(state => state.beads.length);
    const prevBeadCount = useRef(beadCount);

    useEffect(() => {
        if (beadCount > prevBeadCount.current) {
            setUserZoom(1); // Reset zoom on add
        }
        prevBeadCount.current = beadCount;
    }, [beadCount]);
    
    // Store latest zoom in ref for event handlers to access current state without re-binding
    const zoomRef = useRef(1);
    const initialPinchDist = useRef<number>(0);
    const initialPinchZoom = useRef<number>(1);

    useEffect(() => {
        zoomRef.current = userZoom;
    }, [userZoom]);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        const observer = new ResizeObserver((entries) => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        observer.observe(container);

        // --- Zoom Event Handlers ---

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            // Zoom Sensitivity
            const delta = -Math.sign(e.deltaY) * 0.1;
            const newZoom = Math.min(Math.max(zoomRef.current + delta, 0.5), 3.0);
            setUserZoom(newZoom);
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDist.current = Math.sqrt(dx * dx + dy * dy);
                initialPinchZoom.current = zoomRef.current;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && initialPinchDist.current > 0) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDist = Math.sqrt(dx * dx + dy * dy);
                
                const scaleFactor = currentDist / initialPinchDist.current;
                const newZoom = Math.min(Math.max(initialPinchZoom.current * scaleFactor, 0.5), 3.0);
                setUserZoom(newZoom);
            }
        };

        // Attach non-passive listeners to allow preventing default (scroll)
        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        // No Clean-up needed for touchEnd since we just reset refs implicitly on next start, 
        // but robust logic resets might help. However, visual glitch is low risk.

        return () => {
            observer.disconnect();
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    const { width, height } = dimensions;

    return (
        <div ref={containerRef} className="w-full h-full touch-none">
            {width > 0 && height > 0 && (
                <Stage width={width} height={height} options={{ backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: 2 }}>
                    <PixiContent width={width} height={height} userZoom={userZoom} />
                </Stage>
            )}
        </div>
    );
};

export default BraceletStage;
