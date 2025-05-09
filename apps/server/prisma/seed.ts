import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.product.deleteMany({});
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
    { name: 'Office Products' },
  ];

  const createdCategories = {};

  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: category,
    });
    createdCategories[category.name] = createdCategory.id;
  }

  console.log('Categories seeded successfully!');

  // Seed products
  const products = [
    {
      name: 'Smartphone Pro Max',
      description:
        'Latest flagship smartphone with advanced camera system and all-day battery life.',
      price: 999.99,
      stock: 50,
      categoryId: createdCategories['Electronics'],
    },
    {
      name: 'Wireless Noise-Cancelling Headphones',
      description:
        'Premium headphones with active noise cancellation and 30-hour battery life.',
      price: 249.99,
      stock: 100,
      categoryId: createdCategories['Electronics'],
    },
    {
      name: "Men's Classic Fit T-Shirt",
      description: 'Comfortable cotton t-shirt available in multiple colors.',
      price: 19.99,
      stock: 200,
      categoryId: createdCategories['Clothing'],
    },
    {
      name: "Women's Running Shoes",
      description:
        'Lightweight and breathable running shoes with cushioned soles.',
      price: 89.99,
      stock: 75,
      categoryId: createdCategories['Clothing'],
    },
    {
      name: 'The Art of Programming',
      description:
        'Comprehensive guide to modern programming techniques and best practices.',
      price: 34.99,
      stock: 30,
      categoryId: createdCategories['Books'],
    },
    {
      name: 'Non-Stick Cookware Set',
      description: '10-piece cookware set with durable non-stick coating.',
      price: 129.99,
      stock: 40,
      categoryId: createdCategories['Home & Kitchen'],
    },
    {
      name: 'Yoga Mat',
      description:
        'Extra thick yoga mat with non-slip surface and carrying strap.',
      price: 29.99,
      stock: 120,
      categoryId: createdCategories['Sports & Outdoors'],
    },
    {
      name: 'Organic Face Serum',
      description: 'Hydrating face serum with vitamin C and hyaluronic acid.',
      price: 24.99,
      stock: 85,
      categoryId: createdCategories['Beauty & Personal Care'],
    },
    {
      name: 'Building Block Set',
      description:
        '500-piece creative building block set compatible with major brands.',
      price: 39.99,
      stock: 60,
      categoryId: createdCategories['Toys & Games'],
    },
    {
      name: 'Car Dash Cam',
      description:
        '4K resolution dash cam with night vision and 128GB storage.',
      price: 79.99,
      stock: 45,
      categoryId: createdCategories['Automotive'],
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log('Products seeded successfully!');

  // Create admin user from environment variables
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN',
      },
    });

    console.log(`Admin user created successfully with email: ${adminEmail}`);
  } else {
    console.log(`Admin user with email ${adminEmail} already exists`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
