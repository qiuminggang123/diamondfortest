"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_LIBRARY = exports.INITIAL_CATEGORIES = void 0;
// Helper to create simple SVG textures
const createBeadSVG = (color1, color2, stringOpacity = 1.0) => {
    const svg = `
  <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- 1. Volume Shading: Smoother, more natural gradient -->
      <!-- Simulates the thickness of the crystal. Light comes from Top-Right. -->
      <radialGradient id="sphereVolume" cx="35%" cy="35%" r="75%" fx="35%" fy="35%">
         <stop offset="50%" style="stop-color:${color1};stop-opacity:0" /> <!-- Clearer center -->
         <stop offset="85%" style="stop-color:${color2};stop-opacity:0.6" /> <!-- Natural edging -->
         <stop offset="100%" style="stop-color:${color2};stop-opacity:0.85" />
      </radialGradient>

      <!-- 2. Borehole Channel: Glassy Tunnel -->
      <linearGradient id="borehole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color2}" stop-opacity="0.5"/>   <!-- Top Wall Shadow -->
        <stop offset="30%" stop-color="${color2}" stop-opacity="0.2"/> 
        <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.15"/>   <!-- Clear Center -->
        <stop offset="70%" stop-color="${color2}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${color2}" stop-opacity="0.5"/>  <!-- Bottom Wall Shadow -->
      </linearGradient>

      <!-- 3. The Cord: Softer, embedded look -->
       <linearGradient id="cord" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E0E0E0" stop-opacity="0.9"/>   
        <stop offset="50%" stop-color="#FFFFFF" stop-opacity="1"/>     <!-- Core Highlight -->
        <stop offset="100%" stop-color="#E0E0E0" stop-opacity="0.9"/> 
       </linearGradient>

      <!-- 4. Caustic Spot: Natural light glowing through the bottom-left -->
      <radialGradient id="causticSpot" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
         <stop offset="0%" style="stop-color:white;stop-opacity:0.5" /> <!-- Soft Bright Core -->
         <stop offset="60%" style="stop-color:${color1};stop-opacity:0.2" />
         <stop offset="100%" style="stop-color:${color1};stop-opacity:0" />
      </radialGradient>
      
      <!-- 5. Blur Filter for internal refractions -->
      <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
      </filter>
    </defs>
    
    <!-- A. BASE GEMS (Main Body) -->
    <!-- Slightly translucent to allow light interaction -->
    <circle cx="50" cy="50" r="49.5" fill="${color1}" fill-opacity="0.85" />

    <!-- B. BOREHOLE CHANNEL (The internal tunnel) -->
    <!-- A subtle dark band representing the hole through the sphere -->
    <rect x="-10" y="41" width="120" height="18" fill="url(#borehole)" />

    <!-- C. INTERNAL REFLECTIONS (Crossing Light Paths) -->
    <!-- Subtle curved lines suggesting internal refraction surfaces -->
    <path d="M -10 42 Q 50 35 110 42" stroke="white" stroke-width="1" stroke-opacity="0.4" fill="none" filter="url(#softBlur)"/>
    <path d="M -10 58 Q 50 65 110 58" stroke="white" stroke-width="1" stroke-opacity="0.4" fill="none" filter="url(#softBlur)"/>

    <!-- D. THE STRING -->
    <line x1="-10" y1="50" x2="110" y2="50" stroke="url(#cord)" stroke-width="4" stroke-opacity="${stringOpacity}" />

    <!-- E. LUMINOUS SIDE WALLS (Borehole Entry/Exit Glow) -->
    <!-- Simulates light catching the rough edges of the drilled hole -->
    <ellipse cx="6" cy="50" rx="3" ry="7" fill="white" fill-opacity="0.6" filter="url(#softBlur)"/>
    <ellipse cx="94" cy="50" rx="3" ry="7" fill="white" fill-opacity="0.6" filter="url(#softBlur)"/>

    <!-- G. VOLUME SHADOW (The 3D feel) -->
    <!-- Standard shading to give roundness -->
    <circle cx="50" cy="50" r="49" fill="url(#sphereVolume)" />

  </svg>
  `.trim();
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};
// Generate Textures updated to match screenshot tones
// EXTREMELY DEEP / HEAVY / SOLID TONES
const IMG_AMETHYST = createBeadSVG('#6A1B9A', '#38006b'); // Deep Purple
const IMG_CITRINE = createBeadSVG('#FBC02D', '#F57F17'); // Deep Gold
const IMG_CLEAR = createBeadSVG('#ECEFF1', '#546E7A'); // Cool White / Greyish
const IMG_ROSE = createBeadSVG('#F48FB1', '#880E4F'); // Deep Pink
// Correcting Tea to Dark Brown/Black (Smokey Quartz)
const IMG_TEA_REAL = createBeadSVG('#5D4037', '#3E2723');
exports.INITIAL_CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'in-use', name: 'In Use' },
    { id: 'crystal', name: 'Crystal' },
    { id: 'amethyst', name: 'Amethyst' },
    { id: 'citrine', name: 'Citrine' },
    { id: 'rose', name: 'Rose Quartz' },
    { id: 'tea', name: 'Smoky Quartz' },
    { id: 'other', name: 'Other' },

];
exports.INITIAL_LIBRARY = [
    {
        id: 'b1',
        name: 'Uruguay Amethyst',
        type: 'amethyst',
        size: 10,
        price: 24,
        image: IMG_AMETHYST
    },
    {
        id: 'b2',
        name: 'Brazil Amethyst',
        type: 'amethyst',
        size: 8,
        price: 18,
        image: IMG_AMETHYST
    },
    {
        id: 'b3',
        name: 'Pure Crystal',
        type: 'crystal',
        size: 10,
        price: 15,
        image: IMG_CLEAR
    },
    {
        id: 'b4',
        name: 'Golden Citrine',
        type: 'citrine',
        size: 12,
        price: 45,
        image: IMG_CITRINE
    },
    {
        id: 'b5',
        name: 'Madagascar Rose Quartz',
        type: 'rose',
        size: 10,
        price: 28,
        image: IMG_ROSE
    },
    {
        id: 'b6',
        name: 'Transparent Smoky Quartz',
        type: 'tea',
        size: 10,
        price: 20,
        image: IMG_TEA_REAL
    }
];
