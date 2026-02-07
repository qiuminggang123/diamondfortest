import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToUnifiedModel() {
  try {
    console.log('开始迁移数据库结构...');
    
    // 1. 首先处理现有的BeadType数据，将其标记为MANAGED类型
    console.log('迁移BeadType数据...');
    const beadTypes = await prisma.beadType.findMany();
    
    for (const beadType of beadTypes) {
      await prisma.bead.create({
        data: {
          id: beadType.id,
          name: beadType.name,
          image: beadType.image,
          size: beadType.size,
          categoryId: beadType.typeId,
          price: beadType.price,
          dominantColor: beadType.dominantColor,
          usageType: 'MANAGED',
          sortOrder: beadType.sortOrder,
          createdAt: beadType.createdAt,
          updatedAt: beadType.updatedAt
        }
      });
      console.log(`迁移BeadType: ${beadType.name}`);
    }
    
    // 2. 处理现有的Bead数据，将其标记为RUNTIME类型
    console.log('迁移Bead数据...');
    const beads = await prisma.bead.findMany();
    
    for (const bead of beads) {
      // 检查是否已经是新结构（避免重复迁移）
      if (!bead.usageType) {
        await prisma.bead.update({
          where: { id: bead.id },
          data: {
            usageType: 'RUNTIME',
            size: bead.size as number
          }
        });
        console.log(`更新Bead: ${bead.name}`);
      }
    }
    
    console.log('数据库迁移完成！');
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行迁移
migrateToUnifiedModel();