import { BeadType } from './types';

// SVG 珠子图像生成函数 - 已迁移到 Vercel Blob
// 以下是示例图像 URL，实际数据将从数据库中获取
const IMG_AMETHYST = '/images/amethyst-bead.svg'; // Deep Purple
const IMG_CITRINE = '/images/citrine-bead.svg'; // Deep Gold
const IMG_CLEAR = '/images/clear-bead.svg'; // Cool White / Greyish
const IMG_ROSE = '/images/rose-bead.svg'; // Deep Pink
const IMG_TEA_REAL = '/images/tea-bead.svg'; // Dark Brown/Black (Smokey Quartz)

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
    image: IMG_AMETHYST,
    dominantColor: '#6A1B9A'
  },
  {
    id: 'b2',
    name: '巴西紫水晶',
    type: 'amethyst',
    size: 8,
    price: 18,
    image: IMG_AMETHYST,
    dominantColor: '#6A1B9A'
  },
  {
    id: 'b3',
    name: '纯净白水晶',
    type: 'crystal',
    size: 10,
    price: 15,
    image: IMG_CLEAR,
    dominantColor: '#ECEFF1'
  },
  {
    id: 'b4',
    name: '金运黄水晶',
    type: 'citrine',
    size: 12,
    price: 45,
    image: IMG_CITRINE,
    dominantColor: '#FBC02D'
  },
  {
    id: 'b5',
    name: '马达加斯加粉晶',
    type: 'rose',
    size: 10,
    price: 28,
    image: IMG_ROSE,
    dominantColor: '#F48FB1'
  },
  {
    id: 'b6',
    name: '通透茶晶',
    type: 'tea',
    size: 10,
    price: 20,
    image: IMG_TEA_REAL,
    dominantColor: '#5D4037'
  }
];
