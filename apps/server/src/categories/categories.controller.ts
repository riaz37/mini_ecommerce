import { Controller, Get, Param, NotFoundException, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Return the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Get products by category ID' })
  @ApiResponse({ status: 200, description: 'Return products in the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of products to return' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for pagination' })
  @Get(':id/products')
  async getCategoryProducts(
    @Param('id') id: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.categoriesService.getCategoryProducts(
      id,
      limit ? parseInt(limit, 10) : undefined,
      page ? parseInt(page, 10) : undefined
    );
  }
}
