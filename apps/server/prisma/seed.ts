import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Clear existing categories
  await prisma.category.deleteMany({});
  
  // Seed categories
  const categories = [
    { name: 'Electronics' },
    { name: 'Clothing' },
    { name: 'Books' },
    { name: 'Home & Kitchen' },
    { name: 'Sports & Outdoors' },
    { name: 'Beauty & Personal Care' },
    { name: 'Toys & Games' },
    { name: 'Automotive' },
    { name: 'Health & Household' },
    { name: 'Office Products' }
  ];

  for (const category of categories) {
    await prisma.category.create({
      data: category
    });
  }

  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });