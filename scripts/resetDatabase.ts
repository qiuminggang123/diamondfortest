import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('开始重置数据库...');
  
  try {
    // 删除所有相关数据，按照依赖关系的逆序删除
    await prisma.designBead.deleteMany({});
    console.log('已删除设计珠子关联数据');
    
    await prisma.bead.deleteMany({});
    console.log('已删除珠子数据');
    
    await prisma.design.deleteMany({});
    console.log('已删除设计数据');
    
    await prisma.order.deleteMany({});
    console.log('已删除订单数据');
    
    await prisma.address.deleteMany({});
    console.log('已删除地址数据');
    
    // 删除用户相关的数据
    await prisma.account.deleteMany({});
    console.log('已删除账户数据');
    
    await prisma.session.deleteMany({});
    console.log('已删除会话数据');
    
    await prisma.beadCategory.deleteMany({});
    console.log('已删除珠子类别数据');
    
    // 最后删除用户
    await prisma.user.deleteMany({});
    console.log('已删除用户数据');
    
    console.log('数据库重置完成');
  } catch (error) {
    console.error('重置数据库时发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function initializeDatabase() {
  console.log('开始初始化数据库...');
  
  try {
    // 创建珠子类别
    const categories = [
      { id: 'crystal', name: 'Crystal' },
      { id: 'amethyst', name: 'Amethyst' },
      { id: 'citrine', name: 'Citrine' },
      { id: 'rose', name: 'Rose Quartz' },
      { id: 'tea', name: 'Smoky Quartz' },
      { id: 'other', name: 'Other' },

    ];
    
    for (const category of categories) {
      await prisma.beadCategory.upsert({
        where: { id: category.id },
        update: {},
        create: {
          id: category.id,
          name: category.name,
        },
      });
    }
    
    console.log('珠子类别初始化完成');
  } catch (error) {
    console.error('初始化数据库时发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await resetDatabase();
    await initializeDatabase();
    console.log('数据库重置和初始化完成！');
  } catch (error) {
    console.error('执行过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}