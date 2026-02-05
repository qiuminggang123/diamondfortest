import { PrismaClient } from '@prisma/client';

async function checkUser() {
  const prisma = new PrismaClient();
  
  try {
    const email = "290448666@qq.com";
    console.log(`🔍 检查用户是否存在: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      console.log('✅ 用户存在:');
      console.log(`  ID: ${user.id}`);
      console.log(`  邮箱: ${user.email}`);
      console.log(`  姓名: ${user.name || '未设置'}`);
      console.log(`  有密码: ${!!user.password}`);
    } else {
      console.log('❌ 用户不存在');
      
      // 如果用户不存在，创建测试用户
      console.log('🔧 创建测试用户...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('Tangguihua123', 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: email,
          name: '测试用户',
          password: hashedPassword
        }
      });
      
      console.log('✅ 测试用户创建成功:');
      console.log(`  ID: ${newUser.id}`);
      console.log(`  邮箱: ${newUser.email}`);
    }
  } catch (error) {
    console.error('❌ 检查用户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();