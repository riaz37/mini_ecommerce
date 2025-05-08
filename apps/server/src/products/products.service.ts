import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateRatingDto } from './dto/create-rating.dto';

interface FindAllParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { category, minPrice, maxPrice, minRating, search } = params;

    return this.prisma.product.findMany({
      where: {
        ...(category && { category: { name: category } }),
        ...(minPrice && { price: { gte: minPrice } }),
        ...(maxPrice && { price: { lte: maxPrice } }),
        ...(minRating && { rating: { gte: minRating } }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }),
      },
      include: {
        category: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: createProductDto,
      include: { category: true },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: { category: true },
      });
    } catch (error) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async createRating(createRatingDto: CreateRatingDto) {
    const { productId, customerId, value, comment } = createRatingDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Check if customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    try {
      // Create or update rating
      const rating = await this.prisma.rating.upsert({
        where: {
          productId_customerId: {
            productId,
            customerId,
          },
        },
        update: {
          value,
          comment,
        },
        create: {
          value,
          comment,
          productId,
          customerId,
        },
      });

      // Update product average rating
      const ratings = await this.prisma.rating.findMany({
        where: { productId },
        select: { value: true },
      });

      const averageRating = 
        ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;

      await this.prisma.product.update({
        where: { id: productId },
        data: { rating: averageRating },
      });

      return rating;
    } catch (error) {
      throw new ConflictException('Error creating rating');
    }
  }

  async getProductRatings(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.prisma.rating.findMany({
      where: { productId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
