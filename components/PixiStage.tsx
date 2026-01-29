'use client';

import { Stage, Container, Sprite, Graphics, Text, useTick, useApp } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useStore } from '@/lib/store';
import React from 'react';
import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { Bead, PIXELS_PER_MM } from '@/lib/types';

// Default logo color
const DEFAULT_LOGO_COLOR = '#E0E5E5'; // 银灰色

// Z-Index Layers
const Z_LOGO = 0; // logo始终最底层
const Z_SHADOW = 10;
const Z_STRING = 20;
const Z_BODY = 30;
const Z_DRAG = 100; // Highest priority for dragging

// Helper: Linear Desaturation (mix with grayscale)
const desaturate = (hex: string, saturation: number = 0.5): string => {
    const c = parseInt(hex.replace('#', ''), 16);
    const r = (c >> 16) & 0xFF;
    const g = (c >> 8) & 0xFF;
    const b = c & 0xFF;
    
    // Standard luminance weights
    const gray = r * 0.3 + g * 0.59 + b * 0.11;
    
    const newR = Math.round(r * saturation + gray * (1 - saturation));
    const newG = Math.round(g * saturation + gray * (1 - saturation));
    const newB = Math.round(b * saturation + gray * (1 - saturation));
    
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
};

// Unified Component controlling both Shadow and Body with optimized Physics (Ref-based) to prevent jitter
const AnimatedBead = memo(({ bead, radius, stageWidth, stageHeight, globalScale, onDrop }: { bead: Bead; radius: number, stageWidth: number, stageHeight: number, globalScale: number, onDrop: (id: string, x: number, y: number) => void }) => {
        // 高光和阴影半径缓动，物理动画不变
        const smoothRadius = useRef((bead.size * PIXELS_PER_MM) / 2);
        useTick(() => {
            const targetRadiusPx = (bead.size * PIXELS_PER_MM) / 2;
            // 只做半径缓动，避免高光阴影抖动
            smoothRadius.current += (targetRadiusPx - smoothRadius.current) * 0.18;
        });
    const app = useApp();
    const shadowContainerRef = useRef<PIXI.Container>(null);
    const bodyContainerRef = useRef<PIXI.Container>(null);
    const spriteRef = useRef<PIXI.Sprite>(null); // For rotating the texture independently of the highlight
    
    // Initial Spawn Position: 左下45度方向，距离为braceletOuterRadius+60（Pixi坐标系下应为theta=3π/4）
    const braceletOuterRadius = radius + (bead.size * PIXELS_PER_MM / 2);
    const spawnDistance = braceletOuterRadius + 240; // 240px为环外偏移，减少飞入距离
    // 左下60度，Pixi坐标系极角theta=120°=2*Math.PI/3
    const theta = 2 * Math.PI / 3;
    const spawnX = Math.cos(theta) * spawnDistance;
    const spawnY = Math.sin(theta) * spawnDistance;

    // Physics State (Refs for performance - reduces React renders @ 60fps)
    const physicsState = useRef({
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        vr: 0,
        visualRotation: 0
    });

    const isDragging = useRef(false);
    const [isDraggingState, setIsDraggingState] = useState(false); // Only for cursor/z-index updates
    const [cursor, setCursor] = useState('pointer');

    const targetPos = { x: bead.x || 0, y: bead.y || 0 };
    
    // --- Optimized Filters (Memoized with Padding) ---
    // Fixes "square artifact" by adding padding to avoid clipping
    const filters = useMemo(() => {
        const shadow = new PIXI.BlurFilter(2.5, 4);
        shadow.padding = 30; // Prevent clipping
        
        const caustic = new PIXI.BlurFilter(6, 4);
        caustic.padding = 30;

        const highlight = new PIXI.BlurFilter(0.8, 4);
        highlight.padding = 20; // Essential for sharp highlights without square edges

        return {
            shadow: [shadow],
            caustic: [caustic],
            highlight: [highlight]
        };
    }, []);

    // --- Global Drag Handlers ---
    const handleGlobalDragMove = useCallback((event: any) => {
        if (!isDragging.current || !bodyContainerRef.current?.parent) return;
        const newPos = event.data.getLocalPosition(bodyContainerRef.current.parent);
        
        // Direct Manipulation
        if (bodyContainerRef.current) bodyContainerRef.current.position.set(newPos.x, newPos.y);
        if (shadowContainerRef.current) shadowContainerRef.current.position.set(newPos.x, newPos.y);
        
        // Sync Physics
        physicsState.current.x = newPos.x;
        physicsState.current.y = newPos.y;
    }, []);

    const handleGlobalDragEnd = useCallback((event: any) => {
        if (!isDragging.current) return;
        
        isDragging.current = false;
        setIsDraggingState(false);
        setCursor('pointer');
        
        app.stage.off('pointermove', handleGlobalDragMove);
        app.stage.off('pointerup', handleGlobalDragEnd);
        app.stage.off('pointerupoutside', handleGlobalDragEnd);

        const parent = bodyContainerRef.current?.parent;
        if (parent) {
            const dropPos = event.data.getLocalPosition(parent);
            onDrop(bead.instanceId, dropPos.x, dropPos.y);
        }
    }, [app, bead.instanceId, onDrop, handleGlobalDragMove]);

    // --- Interaction Handlers ---
    const onDragStart = useCallback((event: any) => {
      event.stopPropagation(); 
      isDragging.current = true;
      setIsDraggingState(true);
      setCursor('move');
      
      const startPos = event.data.getLocalPosition(bodyContainerRef.current?.parent);
      
      // Update Physics immediately
      physicsState.current.x = startPos.x;
      physicsState.current.y = startPos.y;
      physicsState.current.vx = 0;
      physicsState.current.vy = 0;
      physicsState.current.vr = 0;

      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.on('pointermove', handleGlobalDragMove);
      app.stage.on('pointerup', handleGlobalDragEnd);
      app.stage.on('pointerupoutside', handleGlobalDragEnd);

    }, [app, handleGlobalDragMove, handleGlobalDragEnd]);

    // Physics / Animation Loop (Runs every frame)
    useTick((delta) => {
        // Skip physics if dragging (controlled by mouse)
        if (isDragging.current) return;

        // INERTIA PHYSICS
        // Lower inertia: smaller stiffness, higher damping
        const stiffness = 0.03 * delta; // 恢复原始弹性
        const damping = 0.75; // 恢复原始阻尼

        // Position Physics
        const tx = targetPos.x;
        const ty = targetPos.y;
        
        const state = physicsState.current;

        const fx = (tx - state.x) * stiffness;
        const fy = (ty - state.y) * stiffness;

        state.vx += fx;
        state.vy += fy;
        state.vx *= damping;
        state.vy *= damping;

        state.x += state.vx * delta;
        state.y += state.vy * delta;

        // Rolling Rotation
        const speed = Math.sqrt(state.vx**2 + state.vy**2);
        
        const tr = bead.rotation || 0;
        let diffRot = tr - state.visualRotation;
        while (diffRot > Math.PI) diffRot -= 2 * Math.PI;
        while (diffRot < -Math.PI) diffRot += 2 * Math.PI;

        const fr = diffRot * stiffness;
        state.vr += fr;
        state.vr *= damping;
        
        if (speed > 1) {
             state.vr += speed * 0.02 * (Math.random() > 0.5 ? 1 : -1); 
        }

        state.visualRotation += state.vr * delta;

        // Snap to target if very close/slow
        if (speed < 0.1 && Math.abs(state.vr) < 0.01 && Math.abs(tx - state.x) < 0.5 && Math.abs(ty - state.y) < 0.5) {
             state.x = tx;
             state.y = ty;
             state.visualRotation = tr;
        }

        // Apply to PIXI Objects
        if (bodyContainerRef.current) {
            bodyContainerRef.current.position.set(state.x, state.y);
        }
        if (shadowContainerRef.current) {
            shadowContainerRef.current.position.set(state.x, state.y);
        }
        if (spriteRef.current) {
            spriteRef.current.rotation = state.visualRotation;
        }
    });

    const beadRadiusPx = (bead.size * PIXELS_PER_MM) / 2;
  
    // --- Cached Draw Functions ---
    const drawShadow = useCallback((g: PIXI.Graphics) => {
            g.clear();
            const r = smoothRadius.current;
            // Deep Contact Shadow
            g.beginFill(0x000000, 0.8); 
            g.drawEllipse(-r * 0.15, r * 0.15, r * 0.7, r * 0.6);
            g.endFill();
            // Diffused Cast Shadow
            g.beginFill(0x000000, 0.4); 
            g.drawEllipse(-r * 0.4, r * 0.4, r * 0.9, r * 0.7);
            g.endFill();
        }, []);

    const drawCaustic = useCallback((g: PIXI.Graphics) => {
            g.clear();
            const r = smoothRadius.current;
            g.beginFill(0xFFFFFF, 0.6);
            g.drawCircle(-r * 0.2, r * 0.2, r * 0.35);
            g.endFill();
        }, []);
  
    const drawHighlight = useCallback((g: PIXI.Graphics) => {
            g.clear();
            const r = smoothRadius.current;
            // Sharp Specular Dot (Top-Right)
            g.beginFill(0xFFFFFF, 1.0); 
            g.drawCircle(r * 0.4, -r * 0.4, r * 0.15);
            g.endFill();
            // Secondary Reflection
            g.beginFill(0xFFFFFF, 0.4);
            g.drawCircle(r * 0.45, -r * 0.45, r * 0.25);
            g.endFill();
        }, []);
  
    // Aspect Ratio Logic
    const [aspectRatio, setAspectRatio] = useState(1);
    useEffect(() => {
        if (!bead.image) return;
        const tex = PIXI.Texture.from(bead.image);
        if (tex.valid) {
            setAspectRatio(tex.width / tex.height);
        } else {
            tex.once('update', () => {
                 if(tex.width && tex.height) setAspectRatio(tex.width / tex.height);
            });
        }
    }, [bead.image]);

    // Calculate fitted dimensions
    const diameter = beadRadiusPx * 2;
    let spriteWidth = diameter;
    let spriteHeight = diameter;
    if (aspectRatio > 1) { // Wide
         spriteHeight = diameter / aspectRatio;
    } else { // Tall
         spriteWidth = diameter * aspectRatio;
    }
  
    return (
      <>
        {/* SHADOW LAYER */}
        <Container
            ref={shadowContainerRef}
            zIndex={Z_SHADOW}
            // Initial Position for first render
            x={physicsState.current.x}
            y={physicsState.current.y}
        >
            <Graphics
                draw={drawShadow}
                filters={filters.shadow} 
                x={-beadRadiusPx * 0.05} 
                y={beadRadiusPx * 0.05} 
            />
            <Graphics
                draw={drawCaustic}
                filters={filters.caustic}
                blendMode={PIXI.BLEND_MODES.ADD}
                x={-beadRadiusPx * 0.05} 
                y={beadRadiusPx * 0.05} 
            />
        </Container>

        {/* BODY LAYER */}
        <Container 
            ref={bodyContainerRef}
            zIndex={isDraggingState ? Z_DRAG : Z_BODY}
            interactive={true}
            cursor={cursor}
            pointerover={() => !isDragging.current && setCursor('pointer')}
            pointerout={() => !isDragging.current && setCursor('default')}
            pointerdown={onDragStart}
            x={physicsState.current.x}
            y={physicsState.current.y}
        >
            {bead.image && (
                <Container>
                    <Sprite
                        ref={spriteRef}
                        image={bead.image}
                        anchor={0.5}
                        width={spriteWidth}
                        height={spriteHeight}
                        rotation={physicsState.current.visualRotation}
                    />
                    
                    {/* Highlights - Static relative to Bead Center (Don't rotate with bead texture) */}
                    {Math.abs(aspectRatio - 1) < 0.1 && (
                        <Graphics 
                            draw={drawHighlight} 
                            filters={filters.highlight}
                        />
                    )}
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
         const speed = 0.05; // Reduced from 0.15 for smoother animation
         
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
const PixiContent = ({ width, height, userZoom = 1, rotation = 0 }: { width: number, height: number, userZoom?: number, rotation?: number }) => {
    const { beads, circumference, removeBead, moveBead } = useStore();
    const targetRadius = (circumference * 10 * PIXELS_PER_MM) / (2 * Math.PI);

    // Retrieve the correct font family for Cinzel from CSS variable
    const [logoFontFamily, setLogoFontFamily] = useState(['serif']);
    useEffect(() => {
        const style = getComputedStyle(document.body);
        const fontVar = style.getPropertyValue('--font-cinzel');
        if (fontVar) {
            // Clean up: '"__Cinzel_..."' -> '__Cinzel_...'
            const clean = fontVar.replace(/"/g, '').split(',')[0].trim();
            if (clean) setLogoFontFamily([clean, 'serif']);
        }
    }, []);
    
    // Auto-Scaling Logic
    const margin = 60; // Padding from screen edge
    const maxBeadSize = useMemo(() => beads.length > 0 ? Math.max(...beads.map(b => b.size)) : 10, [beads]);
    const braceletOuterRadius = targetRadius + (maxBeadSize * PIXELS_PER_MM / 2);
    
    const maxViewableRadius = Math.min(width, height) / 2 - margin;
    const autoScale = braceletOuterRadius > maxViewableRadius ? maxViewableRadius / braceletOuterRadius : 1;
    
    // Combine auto-fit scale with user zoom
    const finalScale = autoScale * userZoom;

    // --- Dynamic Logo Gradient Logic ---
    // 只优先用贴图主色，没有就用dominantColor，没有就用唯一默认色
    const getBeadColor = (bead) => {
        // 贴图主色（同步，已在store处理，或可扩展异步）
        if (bead.dominantColor) return bead.dominantColor;
        return DEFAULT_LOGO_COLOR;
    };
    const logoFill = useMemo(() => {
        if (beads.length === 0) return [DEFAULT_LOGO_COLOR, DEFAULT_LOGO_COLOR];
        const colors = beads.map(getBeadColor);
        const uniqueColors = Array.from(new Set(colors));
        if (uniqueColors.length === 0) return [DEFAULT_LOGO_COLOR, DEFAULT_LOGO_COLOR];
        if (uniqueColors.length === 1) return [uniqueColors[0], uniqueColors[0]];
        return uniqueColors;
    }, [beads]);

    const logoStyle = useMemo(() => new PIXI.TextStyle({
        fontFamily: logoFontFamily, // Matches Header
        fontSize: 36, 
        fontWeight: 'bold', 
        fill: logoFill, 
        fillGradientType: PIXI.TEXT_GRADIENT.LINEAR_HORIZONTAL,
        letterSpacing: 2,
        dropShadow: false,
        padding: 20, 
    }), [logoFill, logoFontFamily]);

    // Handle Drop Logic: Remove or Swap based on angles
    const handleBeadDrop = useCallback((id: string, x: number, y: number) => {
        const draggedBeadIndex = beads.findIndex(b => b.instanceId === id);
        const draggedBead = beads[draggedBeadIndex];
        if (!draggedBead) return;

        const beadRadiusPx = (draggedBead.size * PIXELS_PER_MM) / 2;
        const distFromCenter = Math.sqrt(x * x + y * y);

        // 1. Remove Logic: Only if dragged OUTSIDE the bracelet ring (Outwards)
        // Deletion Buffer: 1.5x bead radius outside target
        if (distFromCenter > (targetRadius + beadRadiusPx * 1.5)) { 
            removeBead(id);
            return;
        }

        // GUARD: Ignore Drops "Too Far Inside" the ring (Center Void)
        // If the bead is dropped way inside the loop (e.g. near the logo), don't trigger reorder.
        // This prevents accidental shuffling when just moving near the center.
        // Threshold: Allow a small gap inside the string (e.g., 1.2x bead radius gap from string)
        const innerThreshold = targetRadius - beadRadiusPx * 2.2; 
        if (distFromCenter < innerThreshold) {
            return; // Too close to center, just snap back
        }

        // 2. Insert Logic: 判断拖拽点在圆环左半边还是右半边，决定顺/逆时针插入调整
        const otherBeads = beads.filter(b => b.instanceId !== id);
        if (otherBeads.length === 0) return;

        // 拖拽点的角度
        const dropAngle = Math.atan2(y, x);
        const dx = Math.cos(dropAngle);
        const dy = Math.sin(dropAngle);

        // 判断左右半边：左半边（PI/2 到 3PI/2），右半边（-PI/2 到 PI/2）
        // atan2范围[-PI, PI]，左半边 x<0，右半边 x>=0
        const isLeftSide = x < 0;

        let bestSlotIndex = -1;
        let bestDot = isLeftSide ? -Infinity : -Infinity;
        const N = otherBeads.length;
        for (let i = 0; i < N; i++) {
            const beadA = otherBeads[i];
            const angleA = Math.atan2(beadA.y || 0, beadA.x || 0);
            const beadB = otherBeads[(i + 1) % N];
            const angleB = Math.atan2(beadB.y || 0, beadB.x || 0);
            const midX = Math.cos(angleA) + Math.cos(angleB);
            const midY = Math.sin(angleA) + Math.sin(angleB);
            const len = Math.sqrt(midX*midX + midY*midY);
            const gapVx = len > 0.001 ? midX / len : Math.cos(angleA + Math.PI/2);
            const gapVy = len > 0.001 ? midY / len : Math.sin(angleA + Math.PI/2);
            const dot = dx * gapVx + dy * gapVy;
            if (isLeftSide) {
                // 左半边，顺时针调整，找 dot 最大
                if (dot > bestDot) {
                    bestDot = dot;
                    bestSlotIndex = i + 1;
                }
            } else {
                // 右半边，逆时针调整，找 dot 最大
                if (dot > bestDot) {
                    bestDot = dot;
                    bestSlotIndex = i + 1;
                }
            }
        }
        if (bestSlotIndex !== -1 && draggedBeadIndex !== -1) {
            moveBead(draggedBeadIndex, bestSlotIndex);
        }

    }, [beads, targetRadius, removeBead, moveBead]);

    return (
        <Container x={width / 2} y={height / 2} sortableChildren={true} scale={finalScale}>
            {/* 0. CENTER LOGO（不旋转，始终最底层） */}
            <Text 
                key={JSON.stringify(logoFill)}
                text="AURA LOOP"
                anchor={0.5}
                style={logoStyle}
                zIndex={Z_LOGO}
                scale={0.5} 
            />
            {/* 1. BEADS和STRING整体旋转 */}
            <Container rotation={rotation}>
                {/* 先渲染手绳，zIndex最低 */}
                <StringLoop targetRadius={targetRadius} />
                {beads.map((bead) => (
                    <AnimatedBead
                        key={bead.instanceId || bead.id || `${bead.id}-${bead.name}`}
                        bead={bead}
                        radius={targetRadius}
                        stageWidth={width}
                        stageHeight={height}
                        globalScale={finalScale}
                        onDrop={handleBeadDrop}
                    />
                ))}
            </Container>
        </Container>
    );
};

// 支持ref导出快照方法，直接默认导出forwardRef
export default React.forwardRef((_props, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
    const [userZoom, setUserZoom] = React.useState(1);
    // Auto-Reset Zoom when Bead Count Increases
    const beadCount = useStore(state => state.beads.length);
    const prevBeadCount = React.useRef(beadCount);
    React.useEffect(() => {
        if (beadCount > prevBeadCount.current) {
            setUserZoom(1); // Reset zoom on add
        }
        prevBeadCount.current = beadCount;
    }, [beadCount]);
    // Store latest zoom in ref for event handlers to access current state without re-binding
    const zoomRef = React.useRef(1);
    const initialPinchDist = React.useRef<number>(0);
    const initialPinchZoom = React.useRef<number>(1);
    React.useEffect(() => {
        zoomRef.current = userZoom;
    }, [userZoom]);
    React.useEffect(() => {
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
    const [rotation, setRotation] = React.useState(0);
    const rotRef = React.useRef(0);
    const velocityRef = React.useRef(0);
    const lastMoveTimeRef = React.useRef(Date.now());
    const { width, height } = dimensions;
    // 只在PixiJS舞台空白区域（最底层Container）滑动时触发旋转
    const pointerDownRef = React.useRef(false);
    const lastXRef = React.useRef<number | null>(null);
    // 舞台空白区域滑动旋转（只在最底层Container内生效）
    const animationIdRef = React.useRef<number | null>(null);
    // 事件处理函数
    const handleBgPointerDown = (e: any) => {
        // 只允许鼠标左键或单指
        if (e.data && e.data.originalEvent) {
            const oe = e.data.originalEvent;
            if ('button' in oe && oe.button !== 0) return;
            if ('touches' in oe && oe.touches.length > 1) return;
            pointerDownRef.current = true;
            lastXRef.current = 'touches' in oe ? oe.touches[0].clientX : oe.clientX;
            velocityRef.current = 0;
            lastMoveTimeRef.current = Date.now();
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
        }
    };
    const handleBgPointerMove = (e: any) => {
        if (!pointerDownRef.current || lastXRef.current === null) return;
        if (e.data && e.data.originalEvent) {
            const oe = e.data.originalEvent;
            if ('touches' in oe && oe.touches.length > 1) return;
            const clientX = 'touches' in oe ? oe.touches[0].clientX : oe.clientX;
            const now = Date.now();
            const deltaX = clientX - lastXRef.current;
            const dt = Math.max(now - lastMoveTimeRef.current, 1);
            lastMoveTimeRef.current = now;
            lastXRef.current = clientX;
            velocityRef.current = -deltaX * 0.006 / dt * 16.67;
            rotRef.current -= deltaX * 0.006;
            setRotation(rotRef.current);
        }
    };
    const handleBgPointerUp = () => {
        pointerDownRef.current = false;
        lastXRef.current = null;
        let v = velocityRef.current;
        const animate = () => {
            if (Math.abs(v) < 0.00005) return;
            rotRef.current += v;
            setRotation(rotRef.current);
            v *= 0.92;
            animationIdRef.current = requestAnimationFrame(animate);
        };
        if (Math.abs(v) > 0.00005) {
            animationIdRef.current = requestAnimationFrame(animate);
        }
    };
    // 导出快照方法（只截取舞台内容，不含UI）
    // 用于存储Pixi Application实例
    const appRef = React.useRef<any>(null);
    React.useImperativeHandle(ref, () => ({
        getStageSnapshot: () => {
            const app = appRef.current;
            if (app && app.renderer && app.stage) {
                const snapshotCanvas = app.renderer.extract.canvas(app.stage);
                return snapshotCanvas.toDataURL('image/png');
            }
            // fallback: 兼容老逻辑
            if (containerRef.current) {
                const canvas = containerRef.current.querySelector('canvas');
                if (canvas) return canvas.toDataURL('image/png');
            }
            return undefined;
        }
    }), []);
    return (
        <div ref={containerRef} className="w-full h-full touch-none" style={{position:'relative'}}>
            {width > 0 && height > 0 && (
                <Stage
                    width={width}
                    height={height}
                    options={{ backgroundAlpha: 1, backgroundColor: 0xffffff, antialias: true, autoDensity: true, resolution: 2 }}
                    onMount={app => { appRef.current = app; }}
                >
                    {/* 最底层透明Container，设置hitArea和事件，只在空白区域滑动时旋转 */}
                    <Container
                        interactive={true}
                        pointerdown={handleBgPointerDown}
                        pointermove={handleBgPointerMove}
                        pointerup={handleBgPointerUp}
                        pointerupoutside={handleBgPointerUp}
                        hitArea={new PIXI.Rectangle(0, 0, width, height)}
                        zIndex={-9999}
                    />
                    <PixiContent width={width} height={height} userZoom={userZoom} rotation={rotation} />
                </Stage>
            )}
        </div>
    );
});
