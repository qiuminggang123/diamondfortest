const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSortOrderField() {
  try {
    console.log('🔍 开始添加sortOrder字段...');
    
    // 检查字段是否已存在
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Bead' AND column_name = 'sortOrder'
    `;
    
    if (columns.length > 0) {
      console.log('✅ sortOrder字段已存在');
      return;
    }
    
    // 添加sortOrder字段
    console.log('➕ 正在添加sortOrder字段...');
    await prisma.$executeRaw`
      ALTER TABLE "Bead" 
      ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0
    `;
    
    // 创建索引
    console.log('.CreateIndex 正在创建索引...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Bead_sortOrder_idx" ON "Bead" ("sortOrder")
    `;
    
    // 更新现有记录的sortOrder值
    console.log('🔄 正在更新现有记录的sortOrder值...');
    await prisma.$executeRaw`
      UPDATE "Bead" 
      SET "sortOrder" = ROW_NUMBER() OVER (ORDER BY "createdAt") - 1
      WHERE "sortOrder" = 0
    `;
    
    console.log('✅ sortOrder字段添加成功!');
    
  } catch (error) {
    console.error('❌ 添加sortOrder字段失败:', error.message);
    
    // 如果是字段已存在的错误，忽略
    if (error.message.includes('column "sortOrder" of relation "Bead" already exists')) {
      console.log('✅ sortOrder字段已存在，无需重复添加');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addSortOrderField();