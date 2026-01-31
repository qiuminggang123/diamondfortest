import { prisma } from '@/lib/prisma';
import { INITIAL_LIBRARY, INITIAL_CATEGORIES } from '@/lib/initialData';

async function main() {
  // 1. 先插入所有分类（如果不存在）
  for (const cat of INITIAL_CATEGORIES) {
    if (cat.id === 'all' || cat.id === 'in-use') continue; // 跳过虚拟分类
    const exist = await prisma.beadCategory.findFirst({ where: { name: cat.name } });
    if (!exist) {
      await prisma.beadCategory.create({ data: { name: cat.name } });
    }
  }

  // 2. 插入珠子（现在直接包含价格字段）
  for (const bead of INITIAL_LIBRARY) {
    // 查找分类
    const cat = await prisma.beadCategory.findFirst({ where: { name: getCategoryName(bead.type) } });
    if (!cat) continue;
    const exist = await prisma.bead.findFirst({ where: { name: bead.name } });
    if (!exist) {
      await prisma.bead.create({
        data: {
          name: bead.name,
          image: bead.image,
          size: bead.size,
          price: bead.price,  // 现在直接使用珠子的价格
          categoryId: cat.id,
          dominantColor: bead.dominantColor || null,
        },
      });
    }
  }

  console.log('初始珠子数据导入完成');
}

function getCategoryName(type: string) {
  const map: Record<string, string> = {
    crystal: '白水晶',
    amethyst: '紫水晶',
    citrine: '黄水晶',
    rose: '粉水晶',
    tea: '茶水晶',
    other: '其他',
  };
  return map[type] || type;
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
