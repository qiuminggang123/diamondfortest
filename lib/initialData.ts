import { BeadType } from './types';

// SVG 珠子图像生成函数 - 已迁移到 Vercel Blob
// 以下是示例图像 URL，实际数据将从数据库中获取
const IMG_AMETHYST = '/images/amethyst-bead.svg'; // Deep Purple
const IMG_CITRINE = '/images/citrine-bead.svg'; // Deep Gold
const IMG_CLEAR = '/images/clear-bead.svg'; // Cool White / Greyish
const IMG_ROSE = '/images/rose-bead.svg'; // Deep Pink
const IMG_TEA_REAL = '/images/tea-bead.svg'; // Dark Brown/Black (Smokey Quartz)

export const INITIAL_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'in-use', name: 'In Use' },
  { id: 'crystal', name: 'Crystal' },
  { id: 'amethyst', name: 'Amethyst' },
  { id: 'citrine', name: 'Citrine' },
  { id: 'rose', name: 'Rose Quartz' },
  { id: 'tea', name: 'Smoky Quartz' },
  { id: 'other', name: 'Other' },
];

export const INITIAL_LIBRARY: BeadType[] = [
  {
    id: 'b1',
    name: 'Uruguay Amethyst',
    type: 'amethyst',
    size: 10,
    price: 24,
    image: IMG_AMETHYST,
    dominantColor: '#6A1B9A'
  },
  {
    id: 'b2',
    name: 'Brazil Amethyst',
    type: 'amethyst',
    size: 8,
    price: 18,
    image: IMG_AMETHYST,
    dominantColor: '#6A1B9A'
  },
  {
    id: 'b3',
    name: 'Pure Crystal',
    type: 'crystal',
    size: 10,
    price: 15,
    image: IMG_CLEAR,
    dominantColor: '#ECEFF1'
  },
  {
    id: 'b4',
    name: 'Golden Citrine',
    type: 'citrine',
    size: 12,
    price: 45,
    image: IMG_CITRINE,
    dominantColor: '#FBC02D'
  },
  {
    id: 'b5',
    name: 'Madagascar Rose Quartz',
    type: 'rose',
    size: 10,
    price: 28,
    image: IMG_ROSE,
    dominantColor: '#F48FB1'
  },
  {
    id: 'b6',
    name: 'Transparent Smoky Quartz',
    type: 'tea',
    size: 10,
    price: 20,
    image: IMG_TEA_REAL,
    dominantColor: '#5D4037'
  }
];
