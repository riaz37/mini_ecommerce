import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateRatingDto } from './dto/create-rating.dto';

interface FindAllParams {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
  limit?: number;
  page?: number;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const {
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      search,
      sortBy,
      sortOrder = 'asc',
      featured,
      limit = 20,
      page = 1,
    } = params;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build the orderBy object based on sortBy and sortOrder
    const orderBy = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' as const };

    // Build the where clause
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined) {
      where.price = { ...where.price, gte: minPrice };
    }

    if (maxPrice !== undefined) {
      where.price = { ...where.price, lte: maxPrice };
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (featured) {
      where.featured = true;
    }

    // Handle search - use contains without mode for compatibility
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy,
      take: Number(limit),
      skip,
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
    // Check if the category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.categoryId} not found`,
      );
    }

    // Create the product if category exists
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

    // Check if customerId is provided and valid
    if (!customerId) {
      throw new BadRequestException('Customer ID is required');
    }

    // Check if customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    try {
      // Check if rating already exists
      const existingRating = await this.prisma.rating.findUnique({
        where: {
          productId_customerId: {
            productId,
            customerId,
          },
        },
      });

      let rating;

      if (existingRating) {
        // Update existing rating
        rating = await this.prisma.rating.update({
          where: {
            id: existingRating.id,
          },
          data: {
            value,
            comment,
            updatedAt: new Date(),
          },
        });

        console.log(
          `Updated rating ${rating.id} for product ${productId} by customer ${customerId}`,
        );
      } else {
        // Create new rating
        rating = await this.prisma.rating.create({
          data: {
            value,
            comment,
            productId,
            customerId,
          },
        });

        console.log(
          `Created new rating ${rating.id} for product ${productId} by customer ${customerId}`,
        );
      }

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
      console.error('Error creating/updating rating:', error);
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
