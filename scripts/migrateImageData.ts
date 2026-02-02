import { PrismaClient } from '@prisma/client';
import { uploadImageToBlob } from '../lib/blob';
import { Buffer } from 'buffer';

const prisma = new PrismaClient();

// 将 base64 数据转换为 Blob 并上传到 Vercel Blob
async function migrateBeadImages() {
  console.log('开始迁移珠子图片数据...');

  try {
    // 获取所有珠子数据
    const beads = await prisma.bead.findMany();
    console.log(`找到 ${beads.length} 个珠子需要处理`);

    for (const bead of beads) {
      // 检查是否已经是 Vercel Blob URL 或其他外部 URL
      if (bead.image && (bead.image.startsWith('http') || bead.image.includes('vercel'))) {
        console.log(`珠子 ${bead.name} 的图片已经是 URL 格式，跳过`);
        continue;
      }

      // 如果是 base64 格式，则需要上传到 Vercel Blob
      if (bead.image && bead.image.startsWith('data:image')) {
        console.log(`正在处理珠子: ${bead.name}`);
        
        try {
          // 将 base64 转换为 Blob 并上传到 Vercel Blob
          const imageUrl = await uploadImageToBlobFromBase64(bead.image, bead.name);
          
          // 更新数据库中的图片字段
          await prisma.bead.update({
            where: { id: bead.id },
            data: { 
              image: imageUrl 
            }
          });
          
          console.log(`珠子 ${bead.name} 图片已更新为: ${imageUrl}`);
        } catch (uploadError) {
          console.error(`上传珠子 ${bead.name} 的图片时出错:`, uploadError);
        }
      } else {
        console.log(`珠子 ${bead.name} 的图片不是 base64 格式，跳过`);
      }
    }

    console.log('珠子图片数据迁移完成！');
  } catch (error) {
    console.error('迁移珠子图片数据时发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 将 base64 转换为 Blob 并上传到 Vercel
async function uploadImageToBlobFromBase64(base64Data: string, beadName: string): Promise<string> {
  // 从 base64 数据中提取类型和内容
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 data');
  }
  
  const mimeType = matches[1];
  const base64Content = matches[2];
  
  // 将 base64 转换为 buffer
  const buffer = Buffer.from(base64Content, 'base64');
  
  // 创建 Blob 对象
  const blob = new Blob([buffer], { type: mimeType });
  
  // 创建一个 File 对象
  const fileExtension = mimeType.split('/')[1] || 'png';
  const fileName = `${beadName.replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;
  const file = new File([blob], fileName, { type: mimeType });
  
  // 上传到 Vercel Blob
  return await uploadImageToBlob(file);
}

async function main() {
  try {
    await migrateBeadImages();
    console.log('数据迁移完成！');
  } catch (error) {
    console.error('执行数据迁移时发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}