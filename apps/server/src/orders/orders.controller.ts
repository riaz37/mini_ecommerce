import {
  Body,
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create a new cart session' })
  @ApiResponse({ status: 201, description: 'New cart session created' })
  @Post('cart/session')
  async createCartSession(@Res({ passthrough: true }) response: Response) {
    const sessionId = uuidv4();

    // Set session ID in HTTP-only cookie
    response.cookie('cart_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
      sameSite: 'strict',
    });

    // Also return it in the response for the initial Redux state
    return { sessionId };
  }

  @ApiOperation({ summary: 'Get cart contents' })
  @ApiResponse({ status: 200, description: 'Return cart contents' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Cart session ID (optional if cookie exists)',
  })
  @Get('cart')
  async getCart(@Query('sessionId') sessionId: string, @Request() req) {
    // Use sessionId from query param or from cookie
    const cartSessionId = sessionId || req.cookies?.cart_session_id;

    if (!cartSessionId) {
      return { items: [], total: 0 };
    }

    return this.ordersService.getCart(cartSessionId);
  }

  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({ status: 200, description: 'Product added to cart' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Post('cart')
  async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    // Use sessionId from body or from cookie
    const sessionId = addToCartDto.sessionId || req.cookies?.cart_session_id;

    if (!sessionId) {
      throw new Error('No cart session found');
    }

    return this.ordersService.addToCart({
      ...addToCartDto,
      sessionId,
    });
  }

  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  @ApiParam({ name: 'productId', description: 'Product ID in cart' })
  @Put('cart/items/:productId')
  async updateCartItem(
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.ordersService.updateCartItem(
      updateCartItemDto.sessionId,
      productId,
      updateCartItemDto.quantity,
    );
  }

  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    description: 'Cart session ID',
  })
  @Delete('cart/items/:productId')
  async removeCartItem(
    @Param('productId') productId: string,
    @Query('sessionId') sessionId: string,
  ) {
    return this.ordersService.removeCartItem(sessionId, productId);
  }

  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @ApiQuery({
    name: 'sessionId',
    required: true,
    description: 'Cart session ID',
  })
  @Delete('cart')
  async clearCart(@Query('sessionId') sessionId: string) {
    return this.ordersService.clearCart(sessionId);
  }

  @ApiOperation({ summary: 'Merge guest cart with user cart' })
  @ApiResponse({ status: 200, description: 'Carts merged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cart/merge')
  async mergeCart(@Body() mergeCartDto: { sessionId: string }, @Request() req) {
    return this.ordersService.checkout({
      sessionId: mergeCartDto.sessionId,
      customerId: req.user.id
    });
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
