import { PrismaClient } from '@prisma/client';

async function fixDatabaseStructure() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting database structure fix...');
    
    // 首先检查Bead表的当前结构
    console.log('Checking current Bead table structure...');
    
    // 使用原始SQL查询检查表结构
    const beadColumns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Bead' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('Current Bead table columns:');
    beadColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 检查是否有记录
    const beadCount = await prisma.bead.count();
    console.log(`Total Bead records: ${beadCount}`);
    
    // 如果表结构不完整，我们需要手动添加缺失的列
    const hasCreatedAt = beadColumns.some(col => col.column_name === 'createdAt');
    const hasUpdatedAt = beadColumns.some(col => col.column_name === 'updatedAt');
    const hasSortOrder = beadColumns.some(col => col.column_name === 'sortOrder');
    
    console.log('\nMissing columns:');
    if (!hasCreatedAt) console.log('  - createdAt');
    if (!hasUpdatedAt) console.log('  - updatedAt');
    if (!hasSortOrder) console.log('  - sortOrder');
    
    // 添加缺失的列
    if (!hasCreatedAt) {
      console.log('Adding createdAt column...');
      await prisma.$executeRaw`
        ALTER TABLE "Bead" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      `;
    }
    
    if (!hasUpdatedAt) {
      console.log('Adding updatedAt column...');
      await prisma.$executeRaw`
        ALTER TABLE "Bead" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      `;
    }
    
    if (!hasSortOrder) {
      console.log('Adding sortOrder column...');
      await prisma.$executeRaw`
        ALTER TABLE "Bead" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0
      `;
    }
    
    // 更新所有记录的updatedAt为当前时间（如果有NULL值的话）
    console.log('Updating updatedAt values...');
    const updatedCount: any = await prisma.$executeRaw`
      UPDATE "Bead" 
      SET "updatedAt" = CURRENT_TIMESTAMP 
      WHERE "updatedAt" IS NULL OR "updatedAt" = '1970-01-01 00:00:00'
    `;
    console.log(`Updated ${updatedCount} records`);
    
    console.log('Database structure fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing database structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseStructure();