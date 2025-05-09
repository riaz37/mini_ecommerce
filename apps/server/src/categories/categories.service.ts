import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany();
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async getCategoryProducts(id: string, limit?: number, page?: number) {
    // First check if the category exists
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Calculate pagination
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    // Get products for the category
    const products = await this.prisma.product.findMany({
      where: {
        categoryId: id,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products;
  }
}
