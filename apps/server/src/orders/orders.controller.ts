import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CheckoutDto } from './dto/checkout.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({ status: 200, description: 'Product added to cart' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Post('cart')
  async addToCart(@Body() addToCartDto: AddToCartDto) {
    return this.ordersService.addToCart(addToCartDto);
  }

  @ApiOperation({ summary: 'Checkout and create an order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart not found or empty' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@Body() checkoutDto: CheckoutDto) {
    return this.ordersService.checkout(checkoutDto);
  }
}
