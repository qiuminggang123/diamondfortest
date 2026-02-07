const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 测试数据库连接...');
    
    // 检查BeadType表
    const beadTypes = await prisma.beadType.findMany({
      include: {
        type: true
      }
    });
    
    console.log(`📊 找到 ${beadTypes.length} 个BeadType记录`);
    
    if (beadTypes.length > 0) {
      console.log('📋 前3个记录:');
      beadTypes.slice(0, 3).forEach((bead, index) => {
        console.log(`${index + 1}. ID: ${bead.id}, Name: ${bead.name}, SortOrder: ${bead.sortOrder}`);
      });
      
      // 测试更新排序
      console.log('\n🧪 测试更新排序...');
      const updatePromises = beadTypes.map((bead, index) => 
        prisma.beadType.update({
          where: { id: bead.id },
          data: { sortOrder: index }
        })
      );
      
      await Promise.all(updatePromises);
      console.log('✅ 排序更新成功!');
      
    } else {
      console.log('❌ 没有找到BeadType记录');
    }
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();