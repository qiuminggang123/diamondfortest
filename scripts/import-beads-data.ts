import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface BeadData {
  name: string;
  size: string;
  price: string;
  url: string;
}

async function importBeadsData() {
  try {
    console.log('🚀 开始导入珠子数据...\n');
    
    // 读取b.json文件
    const jsonDataPath = path.join(process.cwd(), 'prisma', 'b.json');
    const rawData = fs.readFileSync(jsonDataPath, 'utf-8');
    const beadsData: BeadData[] = JSON.parse(rawData);
    
    console.log(`📊 读取到 ${beadsData.length} 条珠子数据\n`);
    
    // 1. 提取唯一的类别名称并创建类别
    const uniqueCategoryNames = [...new Set(beadsData.map(bead => bead.name))];
    console.log(`🏷️  发现 ${uniqueCategoryNames.length} 个唯一类别:`);
    uniqueCategoryNames.forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });
    
    // 2. 创建类别记录
    console.log('\n📁 创建类别记录...');
    const categoryMap = new Map<string, string>(); // name -> categoryId
    
    for (const categoryName of uniqueCategoryNames) {
      // 检查类别是否已存在
      let category = await prisma.beadCategory.findFirst({
        where: { name: categoryName }
      });
      
      if (!category) {
        // 创建新类别
        category = await prisma.beadCategory.create({
          data: {
            name: categoryName
          }
        });
        console.log(`  ✅ 创建类别: ${categoryName} (ID: ${category.id})`);
      } else {
        console.log(`  ℹ️  类别已存在: ${categoryName} (ID: ${category.id})`);
      }
      
      categoryMap.set(categoryName, category.id);
    }
    
    // 3. 创建珠子记录
    console.log('\n💎 创建珠子记录...');
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const beadData of beadsData) {
      const categoryId = categoryMap.get(beadData.name);
      
      if (!categoryId) {
        console.warn(`  ⚠️  无法找到类别 "${beadData.name}" 的ID，跳过珠子: ${beadData.name}`);
        skippedCount++;
        continue;
      }
      
      // 解析尺寸（移除"mm"并转换为数字）
      const sizeStr = beadData.size.replace('mm', '');
      const size = parseInt(sizeStr, 10);
      
      // 解析价格（移除"£"并转换为数字）
      const priceStr = beadData.price.replace('£', '');
      const price = parseFloat(priceStr);
      
      // 检查是否已存在相同的珠子（name + size + categoryId）
      const existingBead = await prisma.bead.findFirst({
        where: {
          name: beadData.name,
          size: size,
          categoryId: categoryId
        }
      });
      
      if (existingBead) {
        console.log(`  ℹ️  珠子已存在，跳过: ${beadData.name} (${beadData.size})`);
        skippedCount++;
        continue;
      }
      
      // 创建新珠子
      const newBead = await prisma.bead.create({
        data: {
          name: beadData.name,
          image: beadData.url,
          size: size,
          categoryId: categoryId,
          price: price
        }
      });
      
      console.log(`  ✅ 创建珠子: ${beadData.name} (${beadData.size}) - £${price}`);
      createdCount++;
    }
    
    // 4. 验证结果
    console.log('\n📈 导入结果统计:');
    console.log(`  • 成功创建珠子: ${createdCount} 个`);
    console.log(`  • 跳过重复珠子: ${skippedCount} 个`);
    
    // 显示类别统计
    console.log('\n📊 类别统计:');
    for (const [categoryName, categoryId] of categoryMap.entries()) {
      const beadCount = await prisma.bead.count({
        where: { categoryId: categoryId }
      });
      console.log(`  • ${categoryName}: ${beadCount} 个珠子`);
    }
    
    console.log('\n✅ 珠子数据导入完成！');
    
  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行导入
importBeadsData().catch((error) => {
  console.error('程序执行失败:', error);
  process.exit(1);
});