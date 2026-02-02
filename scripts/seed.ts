import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 定义初始珠子数据，使用 Vercel Blob URL
const INITIAL_LIBRARY = [
  {
    id: '1',
    name: '白水晶',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsMS5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'crystal',
    price: 10.99,
    dominantColor: '#FFFFFF',
  },
  {
    id: '2',
    name: '紫水晶',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsMi5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'amethyst',
    price: 15.99,
    dominantColor: '#C48ABF',
  },
  {
    id: '3',
    name: '黄水晶',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsMy5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'citrine',
    price: 14.99,
    dominantColor: '#F5ECCE',
  },
  {
    id: '4',
    name: '粉水晶',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsNC5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'rose',
    price: 13.99,
    dominantColor: '#FADADD',
  },
  {
    id: '5',
    name: '茶水晶',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsNS5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'tea',
    price: 12.99,
    dominantColor: '#D2B48C',
  },
  {
    id: '6',
    name: '黑曜石',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsNi5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'other',
    price: 16.99,
    dominantColor: '#000000',
  },
];

async function main() {
  console.log('开始导入初始珠子数据...');

  // 清理可能存在的旧数据
  await prisma.bead.deleteMany({});
  
  // 创建或更新珠子类别
  const categories = [
    { id: 'crystal', name: '白水晶' },
    { id: 'amethyst', name: '紫水晶' },
    { id: 'citrine', name: '黄水晶' },
    { id: 'rose', name: '粉水晶' },
    { id: 'tea', name: '茶水晶' },
    { id: 'other', name: '其他' },
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
    console.log(`确保分类存在: ${category.name} (ID: ${category.id})`);
  }

  // 创建初始珠子数据
  for (const beadData of INITIAL_LIBRARY) {
    await prisma.bead.upsert({
      where: { id: beadData.id },
      update: {},
      create: {
        id: beadData.id,
        name: beadData.name,
        image: beadData.image,
        size: beadData.size,
        price: beadData.price,
        categoryId: beadData.type,
        dominantColor: beadData.dominantColor,
      },
    });
    console.log(`创建或更新珠子: ${beadData.name} (ID: ${beadData.id})`);
  }

  console.log('初始珠子数据导入完成');
}

main()
  .then(async () => {
    console.log('Seed 脚本执行成功');
    await prisma.$disconnect();
  })
  .catch(async (e) => { 
    console.error('Seed 脚本执行出错:', e); 
    await prisma.$disconnect();
    process.exit(1); 
  });