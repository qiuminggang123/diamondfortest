import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImportedData() {
  try {
    console.log('🔍 验证导入的数据...\n');
    
    // 1. 统计总体数据
    const categoryCount = await prisma.beadCategory.count();
    const beadCount = await prisma.bead.count();
    
    console.log('📊 总体统计:');
    console.log(`  • 类别总数: ${categoryCount}`);
    console.log(`  • 珠子总数: ${beadCount}\n`);
    
    // 2. 显示所有类别及其珠子
    console.log('📋 详细数据列表:');
    const categories = await prisma.beadCategory.findMany({
      include: {
        beads: {
          orderBy: [{ size: 'asc' }]
        }
      },
      orderBy: [{ name: 'asc' }]
    });
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.beads.length} 个珠子)`);
      category.beads.forEach(bead => {
        console.log(`   • ${bead.name} - ${bead.size}mm - £${bead.price} - ${bead.image?.substring(0, 50)}...`);
      });
      console.log('');
    });
    
    // 3. 验证数据完整性
    console.log('✅ 数据完整性检查:');
    
    // 检查所有珠子是否都有有效的类别关联
    const allBeads = await prisma.bead.findMany({
      include: { category: true }
    });
    
    const beadsWithoutCategory = allBeads.filter(bead => !bead.category);
    console.log(`  • 孤立珠子数量: ${beadsWithoutCategory.length}`);
    
    // 检查是否有空类别
    const categoriesWithCounts = await prisma.beadCategory.findMany({
      include: {
        _count: {
          select: { beads: true }
        }
      }
    });
    
    const emptyCategories = categoriesWithCounts.filter(cat => cat._count.beads === 0);
    console.log(`  • 空类别数量: ${emptyCategories.length}`);
    
    // 4. 价格范围统计
    console.log('\n💰 价格统计:');
    const priceStats = await prisma.bead.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log(`  • 最低价: £${priceStats._min.price}`);
    console.log(`  • 最高价: £${priceStats._max.price}`);
    console.log(`  • 平均价: £${priceStats._avg.price?.toFixed(2)}`);
    
    // 5. 尺寸分布
    console.log('\n📏 尺寸分布:');
    const sizeGroups = await prisma.bead.groupBy({
      by: ['size'],
      _count: { id: true },
      orderBy: [{ size: 'asc' }]
    });
    
    sizeGroups.forEach(group => {
      console.log(`  • ${group.size}mm: ${group._count.id} 个珠子`);
    });
    
    console.log('\n✅ 数据验证完成！');
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行验证
verifyImportedData();