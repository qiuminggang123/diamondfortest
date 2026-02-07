import { prisma } from '@/lib/prisma';

async function debugSortApi() {
  try {
    console.log('🔍 开始调试排序API...');
    
    // 检查数据库中的BeadType数据
    const beadTypes = await prisma.beadType.findMany({
      include: {
        type: true
      }
    });
    
    console.log(`📊 数据库中有 ${beadTypes.length} 个BeadType记录`);
    
    if (beadTypes.length > 0) {
      console.log('📋 前5个BeadType记录:');
      beadTypes.slice(0, 5).forEach((bead, index) => {
        console.log(`${index + 1}. ID: ${bead.id}, Name: ${bead.name}, SortOrder: ${bead.sortOrder}`);
      });
      
      // 测试批量更新排序
      console.log('\n🧪 测试批量排序更新...');
      const beadIds = beadTypes.map(b => b.id);
      console.log('要更新的Bead IDs:', beadIds);
      
      const updatePromises = beadIds.map((beadId: string, index: number) =>
        prisma.beadType.update({
          where: { id: beadId },
          data: { sortOrder: index }
        })
      );
      
      await Promise.all(updatePromises);
      console.log('✅ 批量排序更新成功!');
      
      // 验证更新结果
      const updatedBeadTypes = await prisma.beadType.findMany({
        orderBy: { sortOrder: 'asc' }
      });
      
      console.log('\n📋 更新后的排序结果:');
      updatedBeadTypes.forEach((bead, index) => {
        console.log(`${index + 1}. ID: ${bead.id}, Name: ${bead.name}, SortOrder: ${bead.sortOrder}`);
      });
      
    } else {
      console.log('❌ 数据库中没有BeadType数据');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSortApi();