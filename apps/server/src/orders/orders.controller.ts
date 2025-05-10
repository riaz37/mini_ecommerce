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
  Req,
  BadRequestException,
  NotFoundException,
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
import { Request as ExpressRequest } from 'express';

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
  @Get('cart')
  async getCart(@Req() request: Request) {
    // Check if user is authenticated
    const user = (request as any).user;
    const cookies = (request as unknown as ExpressRequest).cookies;
    const sessionId = cookies?.cart_session_id;

    // If user is authenticated, get their cart by user ID
    if (user) {
      try {
        return this.ordersService.getUserCart(user.userId);
      } catch (error) {
        // If user cart not found, fall back to session cart
        if (sessionId) {
          return this.ordersService.getCart(sessionId);
        }
        throw new BadRequestException('No cart found');
      }
    }

    // For guest users, require session ID
    if (!sessionId) {
      throw new BadRequestException('No cart session found');
    }

    return this.ordersService.getCart(sessionId);
  }

  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({ status: 200, description: 'Product added to cart' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Post('cart/add')
  async addToCart(@Body() addToCartDto: AddToCartDto, @Req() request: Request) {
    // Check if cookies exist
    const cookies = (request as unknown as ExpressRequest).cookies;

    if (!cookies || !cookies.cart_session_id) {
      throw new BadRequestException('No cart session found');
    }

    const sessionId = cookies.cart_session_id;

    // Use sessionId from cookies
    return this.ordersService.addToCart(
      sessionId,
      addToCartDto.productId,
      addToCartDto.quantity,
    );
  }

  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  @ApiParam({ name: 'productId', description: 'Product ID in cart' })
  @Put('cart/items/:productId')
  async updateCartItem(
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Req() request: Request,
  ) {
    const sessionId = (request as unknown as ExpressRequest).cookies[
      'cart_session_id'
    ];

    if (!sessionId) {
      throw new BadRequestException('No cart session found');
    }

    return this.ordersService.updateCartItem(
      sessionId,
      productId,
      updateCartItemDto.quantity,
    );
  }

  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove' })
  @Delete('cart/items/:productId')
  async removeCartItem(
    @Param('productId') productId: string,
    @Req() request: Request,
  ) {
    const sessionId = (request as unknown as ExpressRequest).cookies[
      'cart_session_id'
    ];

    if (!sessionId) {
      throw new BadRequestException('No cart session found');
    }

    return this.ordersService.removeCartItem(sessionId, productId);
  }

  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @Delete('cart')
  async clearCart(@Req() request: Request) {
    const sessionId = (request as unknown as ExpressRequest).cookies[
      'cart_session_id'
    ];

    if (!sessionId) {
      throw new BadRequestException('No cart session found');
    }

    return this.ordersService.clearCart(sessionId);
  }

  @ApiOperation({ summary: 'Merge guest cart with user cart' })
  @ApiResponse({ status: 200, description: 'Carts merged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cart/merge')
  async mergeCart(@Request() req) {
    const cookies = (req as unknown as ExpressRequest).cookies;
    const sessionId = cookies?.cart_session_id;

    if (!sessionId) {
      return { message: 'No guest cart to merge' };
    }

    return this.ordersService.mergeCart(sessionId, req.user.userId);
  }

  @ApiOperation({ summary: 'Checkout and create an order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cart not found or empty' })
  @Post('checkout')
  async checkout(
    @Body() checkoutDto: CheckoutDto,
    @Req() request: ExpressRequest,
  ) {
    // Get sessionId from cookies instead of request body
    const cookies = request.cookies;
    const sessionId = cookies?.cart_session_id;

    if (!sessionId) {
      throw new BadRequestException('No cart session found');
    }

    const { customerId, shippingAddress, paymentMethod } = checkoutDto;

    // Get cart from Redis
    const cart = await this.ordersService.getCart(sessionId);

    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    // Create Stripe checkout session for credit card payments
    if (paymentMethod.type === 'credit_card') {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cart.items.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout?canceled=true`,
        metadata: {
          sessionId,
          customerId: customerId || '',
          shippingAddress: JSON.stringify(shippingAddress),
        },
      });

      return { url: session.url };
    }

    // For non-Stripe payments, use the existing checkout flow
    return this.ordersService.checkout({
      sessionId,
      customerId,
      shippingAddress,
      paymentMethod,
    });
  }

  @ApiOperation({ summary: 'Handle successful Stripe checkout' })
  @Get('checkout/success')
  async handleStripeSuccess(@Query('session_id') sessionId: string) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Create order from the session metadata
    const {
      sessionId: cartSessionId,
      customerId,
      shippingAddress,
    } = session.metadata;

    // Create order in database
    const order = await this.ordersService.checkout({
      sessionId: cartSessionId,
      customerId: customerId || undefined,
      shippingAddress: JSON.parse(shippingAddress),
      paymentMethod: {
        type: 'credit_card',
      },
      cart: await this.ordersService.getCart(cartSessionId),
      stripeSession: session,
    });

    return order;
  }
}
