import { BeadType } from './types';

// Helper to create simple SVG textures
const createBeadSVG = (color1: string, color2: string, stringColor: string = '#999999') => {
  const svg = `
  <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Volume Shadow Gradient (Dark Edges) -->
      <radialGradient id="sphereVolume" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
         <stop offset="60%" style="stop-color:${color2};stop-opacity:0" />
         <stop offset="100%" style="stop-color:${color2};stop-opacity:0.4" />
      </radialGradient>

      <!-- Inner Caustic Glow (Focuses light at bottom-left) -->
      <radialGradient id="innerGlow" cx="50%" cy="50%" r="48%" fx="35%" fy="65%">
        <stop offset="0%" style="stop-color:white;stop-opacity:0.3" />
        <stop offset="60%" style="stop-color:${color1};stop-opacity:0.1" />
        <stop offset="100%" style="stop-color:${color1};stop-opacity:0" />
      </radialGradient>

      <!-- 1. Borehole Gradient: Frosted White with subtle shadow edges -->
       <linearGradient id="borehole" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#AAAAAA" stop-opacity="0.3"/> <!-- Shadow Edge -->
        <stop offset="25%" stop-color="#FFFFFF" stop-opacity="0.2"/>
        <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.0"/> <!-- Hollow Center -->
        <stop offset="75%" stop-color="#FFFFFF" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#AAAAAA" stop-opacity="0.3"/> <!-- Shadow Edge -->
      </linearGradient>

      <!-- 2. The Elastic Cord: Pure bright white string (#FFFFFF) -->
       <linearGradient id="cord" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>   
        <stop offset="40%" stop-color="#FFFFFF" stop-opacity="1"/>   <!-- Pure Bright White Core -->
        <stop offset="60%" stop-color="#FFFFFF" stop-opacity="1"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.9"/> 
       </linearGradient>
      
      <!-- 3. Refraction Glint: A sharp highlight running along the hole (Glass tube effect) -->
      <linearGradient id="refractionGlint" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="white" stop-opacity="0"/>
         <stop offset="10%" stop-color="white" stop-opacity="0.6"/> <!-- Stronger Top Glint -->
         <stop offset="30%" stop-color="white" stop-opacity="0"/>
         <stop offset="70%" stop-color="white" stop-opacity="0"/>
         <stop offset="90%" stop-color="white" stop-opacity="0.4"/> <!-- Bottom Glint -->
         <stop offset="100%" stop-color="white" stop-opacity="0"/>
      </linearGradient>
    </defs>
    
    <!-- LAYER 0: OCCLUSION BASE (Adjusted for transparency) -->
    <!-- Solid color base opacity 0.95: High enough to hide stage string, but allows slight blending -->
    <circle cx="50" cy="50" r="49.5" fill="${color1}" fill-opacity="0.95" />

    <!-- LAYER 0.5: DARK CHANNEL BACKING (CRITICAL FOR CONTRAST) -->
    <!-- This simulates the "shadow" inside the drilled hole. -->
    <!-- Without this, the white string disappears against the light bead color. -->
    <rect x="0" y="40" width="100" height="20" fill="#222222" fill-opacity="0.25" />

    <!-- LAYER 1: BACK FACET -->
    <circle cx="50" cy="50" r="49" fill="${color2}" fill-opacity="0.15" />

    <!-- LAYER 2: THE BOREHOLE CHANNEL (Drilled Hole) -->
    <!-- Added slight grey edge for definition -->
    <path d="M 0 50 L 100 50" stroke="url(#borehole)" stroke-width="14" stroke-linecap="butt" />

    <!-- LAYER 3: REFRACTION GLINT ON HOLE -->
    <!-- Makes the hole look like a glass tube. -->
    <path d="M 0 50 L 100 50" stroke="url(#refractionGlint)" stroke-width="14" stroke-linecap="butt" />

    <!-- LAYER 4: THE ELASTIC CORD -->
    <!-- Pure White String. Slightly thicker for visibility. -->
    <path d="M 0 50 L 100 50" stroke="url(#cord)" stroke-width="6" />

    <!-- LAYER 6: INNER GLOW (Caustics) -->
    <circle cx="50" cy="50" r="48" fill="url(#innerGlow)" />

    <!-- LAYER 7: VOLUME SHADING (Edges) -->
    <circle cx="50" cy="50" r="49" fill="url(#sphereVolume)" />

  </svg>
  `.trim();
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// Generate Textures updated to match screenshot tones
// Screenshot tones are softer, more pastel/translucent
const IMG_AMETHYST = createBeadSVG('#D7BDE2', '#884EA0'); // Soft Lavender -> Deep Purple
const IMG_CITRINE = createBeadSVG('#F9E79F', '#D4AC0D'); // Pale Yellow -> Golden
const IMG_CLEAR = createBeadSVG('#FDFFEF', '#BDC3C7'); // Warm White -> Light Grey (Clear)
const IMG_ROSE = createBeadSVG('#FADBD8', '#E6B0AA'); // Pale Pink -> Soft Red
const IMG_TEA = createBeadSVG('#EDBB99', '#873600'); // Soft Bronze -> Brown

export const INITIAL_CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'in-use', name: '正在使用' },
  { id: 'crystal', name: '白水晶' },
  { id: 'amethyst', name: '紫水晶' },
  { id: 'citrine', name: '黄水晶' },
  { id: 'rose', name: '粉水晶' },
  { id: 'tea', name: '茶水晶' },
  { id: 'other', name: '其他' },
];

export const INITIAL_LIBRARY: BeadType[] = [
  {
    id: 'b1',
    name: '乌拉圭紫水晶',
    type: 'amethyst',
    size: 10,
    price: 24,
    image: IMG_AMETHYST
  },
  {
    id: 'b2',
    name: '巴西紫水晶',
    type: 'amethyst',
    size: 8,
    price: 18,
    image: IMG_AMETHYST
  },
  {
    id: 'b3',
    name: '纯净白水晶',
    type: 'crystal',
    size: 10,
    price: 15,
    image: IMG_CLEAR
  },
  {
    id: 'b4',
    name: '金运黄水晶',
    type: 'citrine',
    size: 12,
    price: 45,
    image: IMG_CITRINE
  },
  {
    id: 'b5',
    name: '马达加斯加粉晶',
    type: 'rose',
    size: 10,
    price: 28,
    image: IMG_ROSE
  },
  {
    id: 'b6',
    name: '通透茶晶',
    type: 'tea',
    size: 10,
    price: 20,
    image: IMG_TEA
  }
];
