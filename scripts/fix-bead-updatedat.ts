import { PrismaClient } from '@prisma/client';

async function fixBeadUpdatedAt() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking Bead table for NULL updatedAt values...');
    
    // 使用原始SQL查询检查NULL值
    const nullRecords: any[] = await prisma.$queryRaw`
      SELECT id, "createdAt", "updatedAt" 
      FROM "Bead" 
      WHERE "updatedAt" IS NULL
    `;
    
    console.log(`Found ${nullRecords.length} records with NULL updatedAt`);
    
    if (nullRecords.length > 0) {
      console.log('Sample records with NULL updatedAt:');
      nullRecords.slice(0, 3).forEach(record => {
        console.log(`ID: ${record.id}, createdAt: ${record.createdAt}, updatedAt: ${record.updatedAt}`);
      });
      
      console.log('Updating NULL updatedAt values to current timestamp...');
      
      // 使用原始SQL更新NULL值
      const result: any = await prisma.$executeRaw`
        UPDATE "Bead" 
        SET "updatedAt" = NOW() 
        WHERE "updatedAt" IS NULL
      `;
      
      console.log(`Updated ${result} records`);
    } else {
      console.log('No NULL updatedAt values found');
    }
    
    // 验证更新结果
    const remainingNullRecords: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Bead" 
      WHERE "updatedAt" IS NULL
    `;
    
    console.log(`Remaining NULL updatedAt records: ${remainingNullRecords[0].count}`);
    
  } catch (error) {
    console.error('Error fixing updatedAt values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBeadUpdatedAt();