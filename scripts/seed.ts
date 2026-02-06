import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 定义初始珠子数据，使用 Vercel Blob URL
const INITIAL_LIBRARY = [
  {
    id: '1',
    name: 'Clear Quartz',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsMS5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'crystal',
    price: 10.99,
    dominantColor: '#FFFFFF',
  },
  {
    id: '2',
    name: 'Amethyst',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsMi5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'amethyst',
    price: 15.99,
    dominantColor: '#C48ABF',
  },
  {
    id: '3',
    name: 'Citrine',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsMy5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'citrine',
    price: 14.99,
    dominantColor: '#F5ECCE',
  },
  {
    id: '4',
    name: 'Rose Quartz',
    image: 'https://public.blob.vercel-storage.com/e2fybWFuL2Fzc2V0cy9pbWFnZXMvY3J5c3RhbC1iZWFkcy9jcnlzdGFsNC5qcGctLVNOMjhBYm5QaWxXVzN0R0FqUm9LQUFhQVE1VW1Qc3dLWWZ6VUdZSzN5Z2RBQV8_mimeType-image___-C2GAXK8knC7393Nl44U6a4qJ4N15F7.png',
    size: 8,
    type: 'rose',
    price: 13.99,
    dominantColor: '#FADADD',
  },
  {
    id: '5',
    name: 'Smoky Quartz',
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
  console.log('Starting to import initial bead data...');

  // Clean up any existing old data
  await prisma.bead.deleteMany({});
  
  // Create or update bead categories
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
    console.log(`确保分类存在: ${category.name} (ID: ${category.id})`);
  }

  // Create initial bead data
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
    console.log(`Created or updated bead: ${beadData.name} (ID: ${beadData.id})`);
  }

  console.log('Initial bead data import completed');
}

main()
  .then(async () => {
    console.log('Seed script executed successfully');
    await prisma.$disconnect();
  })
  .catch(async (e) => { 
    console.error('Seed script execution error:', e); 
    await prisma.$disconnect();
    process.exit(1); 
  });