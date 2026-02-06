import { PrismaClient } from '@prisma/client';
import { uploadImageToBlob } from '../lib/blob';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// SVG 珠子图像生成函数
const createBeadSVG = (primaryColor: string, secondaryColor: string, stringOpacity: number = 0.4) => {
  const svg = `
  <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

    <defs>
      <!-- A. GRADIENTS -->
      <!-- Sphere Volume Gradient (Core to Surface) -->
      <radialGradient id="sphereVolume" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
        <stop offset="0%" stop-color="${secondaryColor}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="${primaryColor}" stop-opacity="1" />
      </radialGradient>

      <!-- B. BOREHOLE GRADIENT (The internal tunnel) -->
      <linearGradient id="borehole" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#1A1A1A" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.9" />
      </linearGradient>

      <!-- C. STRING GRADIENT -->
      <linearGradient id="cord" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#E8E8E8" />
        <stop offset="100%" stop-color="#C0C0C0" />
      </linearGradient>

      <!-- D. SOFT BLUR FILTER -->
      <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>
    </defs>

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

async function convertBase64ToBlob(base64Str: string, fileName: string): Promise<Blob> {
  // 移除 base64 前缀
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '');
  
  // 将 base64 转换为 buffer
  const buffer = Buffer.from(base64Data, 'base64');
  
  // 创建临时文件
  const tempPath = path.join(__dirname, `${fileName}.tmp`);
  fs.writeFileSync(tempPath, buffer);
  
  // 读取文件并创建 blob
  const fileBuffer = fs.readFileSync(tempPath);
  const blob = new Blob([fileBuffer], { type: 'image/svg+xml' });
  
  // 删除临时文件
  fs.unlinkSync(tempPath);
  
  return blob;
}

async function uploadAndConvertBeadImages() {
  try {
    // 生成初始珠子数据
    const IMG_AMETHYST = createBeadSVG('#6A1B9A', '#38006b'); // Deep Purple
    const IMG_CITRINE = createBeadSVG('#FBC02D', '#F57F17'); // Deep Gold
    const IMG_CLEAR = createBeadSVG('#ECEFF1', '#546E7A'); // Cool White / Greyish
    const IMG_ROSE = createBeadSVG('#F48FB1', '#880E4F'); // Deep Pink
    const IMG_TEA_REAL = createBeadSVG('#5D4037', '#3E2723'); // Dark Brown/Black (Smokey Quartz)

    const initialBeads = [
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

    // 查找现有的珠子数据
    const existingBeads = await prisma.bead.findMany({
      where: {
        id: { in: initialBeads.map(b => b.id) }
      }
    });

    console.log(`找到 ${existingBeads.length} 个现有的初始珠子`);

    for (const bead of initialBeads) {
      // 检查珠子是否已存在
      const existingBead = existingBeads.find(b => b.id === bead.id);
      
      if (existingBead) {
        console.log(`珠子 ${bead.name} 已存在，跳过`);
        continue;
      }

      console.log(`正在处理珠子: ${bead.name}`);

      // 将 base64 转换为 Blob
      const blob = await convertBase64ToBlob(bead.image, `bead-${bead.id}`);

      // 创建一个临时的 File 对象
      const file = new File([blob], `bead-${bead.id}.svg`, { type: 'image/svg+xml' });

      // 上传到 Vercel Blob
      try {
        const imageUrl = await uploadImageToBlob(file);
        
        // 查找对应的类别 ID
        let category = await prisma.beadCategory.findFirst({
          where: { name: bead.type }
        });
        
        if (!category) {
          // 如果类别不存在，则创建它
          category = await prisma.beadCategory.create({
            data: {
              name: bead.type
            }
          });
          console.log(`创建了新的珠子类别: ${bead.type}`);
        }

        // 创建珠子记录
        await prisma.bead.create({
          data: {
            id: bead.id,
            name: bead.name,
            image: imageUrl,
            size: bead.size,
            price: bead.price,
            categoryId: category.id,
            dominantColor: bead.dominantColor
          }
        });

        console.log(`珠子 ${bead.name} 已成功上传并保存到数据库`);
      } catch (error) {
        console.error(`上传珠子 ${bead.name} 时出错:`, error);
      }
    }

    console.log('初始珠子图片上传完成');
  } catch (error) {
    console.error('上传初始珠子图片时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadAndConvertBeadImages()
  .then(() => console.log('脚本执行完成'))
  .catch(err => console.error('脚本执行失败:', err));