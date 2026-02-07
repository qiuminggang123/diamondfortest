#!/usr/bin/env tsx

async function checkCategories() {
  try {
    const { prisma } = await import('../lib/prisma');
    
    const categories = await prisma.beadCategory.findMany();
    console.log('数据库中的类别:');
    categories.forEach(cat => {
      console.log(`- ${cat.id}: ${cat.name}`);
    });
    
    const beads = await prisma.beadType.findMany({
      include: {
        type: true
      }
    });
    console.log('\n数据库中的珠子:');
    beads.forEach(bead => {
      console.log(`- ${bead.name} (${bead.type.name}) - sortOrder: ${bead.sortOrder}`);
    });
    
  } catch (error) {
    console.error('查询失败:', error);
  }
}

checkCategories();