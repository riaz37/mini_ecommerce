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
  InternalServerErrorException,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto, PaymentMethodType } from './dto/checkout.dto';
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
import { CookieUtil } from '../common/utils/cookie.util';

@ApiTags('orders')
@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cookieUtil: CookieUtil,
  ) {}

  @ApiOperation({ summary: 'Create a new cart session' })
  @ApiResponse({ status: 201, description: 'New cart session created' })
  @Post('cart/session')
  async createCartSession(
    @Res({ passthrough: true }) response: Response,
    @Req() request: ExpressRequest,
  ) {
    const sessionId = this.ensureCartSession(request, response);
    return { sessionId };
  }

  @ApiOperation({ summary: 'Get cart contents' })
  @ApiResponse({ status: 200, description: 'Return cart contents' })
  @Get('cart')
  async getCart(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Check if user is authenticated
    const user = (request as any).user;

    // If user is authenticated, get their cart by user ID
    if (user) {
      try {
        console.log(`Getting cart for authenticated user: ${user.userId}`);
        const userCart = await this.ordersService.getUserCart(user.userId);
        console.log(`User cart retrieved:`, userCart);
        return userCart;
      } catch (error) {
        console.error(`Error getting user cart: ${error.message}`);
        // Fall through to session cart handling
      }
    }

    // For guest users or if user cart retrieval failed
    const sessionId = this.ensureCartSession(request, response);

    // If this is a new session, return empty cart
    if (!request.cookies?.cart_session_id) {
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };
    }

    // Otherwise get cart from Redis
    console.log(`Getting cart for session: ${sessionId}`);
    return this.ordersService.getCart(sessionId);
  }

  @ApiOperation({ summary: 'Add a product to cart' })
  @ApiResponse({ status: 200, description: 'Product added to cart' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Post('cart/add')
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionId = this.ensureCartSession(request, response);

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
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionId = this.ensureCartSession(request, response);

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
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionId = this.ensureCartSession(request, response);

    return this.ordersService.removeCartItem(sessionId, productId);
  }

  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @Delete('cart')
  async clearCart(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const sessionId = this.ensureCartSession(request, response);

      console.log(`Clearing cart for session: ${sessionId}`);
      const result = await this.ordersService.clearCart(sessionId);
      console.log('Cart cleared successfully:', result);

      return result;
    } catch (error) {
      console.error('Error in clearCart controller:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Merge guest cart with user cart' })
  @ApiResponse({ status: 200, description: 'Carts merged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cart/merge')
  async mergeCart(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    const sessionId = this.ensureCartSession(req, response);

    if (!sessionId) {
      return {
        message: 'No guest cart to merge',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };
    }

    return this.ordersService.mergeCart(sessionId, req.user.userId);
  }

  @ApiOperation({ summary: 'Process checkout' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Cart not found or empty' })
  @Post('checkout')
  async checkout(
    @Body() checkoutDto: CheckoutDto,
    @Req() request: ExpressRequest,
  ) {
    try {
      // If sessionId is not provided in the DTO, get it from cookies
      if (!checkoutDto.sessionId && request.cookies?.cart_session_id) {
        checkoutDto.sessionId = request.cookies.cart_session_id;
      }

      // Validate that we have a sessionId
      if (!checkoutDto.sessionId) {
        throw new BadRequestException('Session ID is required');
      }

      // Get cart from Redis
      const cart = await this.ordersService.getCart(checkoutDto.sessionId);

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // For credit card payments, create a Stripe checkout session
      if (checkoutDto.paymentMethod.type === PaymentMethodType.CREDIT_CARD) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Format line items for Stripe
        const lineItems = cart.items.map((item) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        }));

        // Store shipping address and customer ID in metadata
        const metadata = {
          sessionId: checkoutDto.sessionId,
          shippingAddress: JSON.stringify(checkoutDto.shippingAddress),
        };

        if (checkoutDto.customerId) {
          metadata['customerId'] = checkoutDto.customerId;
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
          metadata: metadata,
        });

        // Return the session URL for the frontend to redirect to
        return { url: session.url };
      } else {
        // For other payment methods, process directly
        return this.ordersService.checkout(checkoutDto);
      }
    } catch (error) {
      this.handleControllerError(error, 'Failed to create order');
    }
  }

  @ApiOperation({ summary: 'Handle successful Stripe checkout' })
  @Get('/checkout/success')
  async handleStripeSuccess(
    @Query('session_id') sessionId: string,
    @Req() request: ExpressRequest,
  ) {
    try {
      console.log(`Processing success for Stripe session: ${sessionId}`);

      if (!sessionId) {
        throw new BadRequestException('Missing Stripe session ID');
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      try {
        // Retrieve the Stripe checkout session with expanded data
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent', 'line_items'],
        });

        console.log(
          `Retrieved Stripe session: ${session.id}, payment status: ${session.payment_status}`,
        );

        // Verify the payment was successful
        if (session.payment_status !== 'paid') {
          throw new BadRequestException(
            `Payment not completed. Status: ${session.payment_status}`,
          );
        }

        // Create order directly from Stripe session data
        const order =
          await this.ordersService.createOrderFromStripeSession(session);

        // Try to clear the cart if it exists, but don't fail if it doesn't
        try {
          const cartSessionId = session.metadata?.sessionId;
          if (cartSessionId) {
            await this.ordersService.clearCart(cartSessionId);
          }
        } catch (cartError) {
          console.error('Error clearing cart:', cartError);
          // Continue processing, don't fail the request
        }

        return order;
      } catch (error) {
        console.error(`Error processing Stripe session ${sessionId}:`, error);
        throw new InternalServerErrorException('Failed to process payment');
      }
    } catch (error) {
      console.error('Error in handleStripeSuccess:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Return user orders' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/orders')
  async getUserOrders(@Request() req) {
    try {
      const userId = req.user.userId;
      return this.ordersService.getUserOrders(userId);
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw new InternalServerErrorException('Failed to retrieve orders');
    }
  }

  // Helper method for consistent error handling in controllers
  private handleControllerError(error: any, defaultMessage: string): never {
    // If it's already a NestJS exception, rethrow it
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException ||
      error instanceof InternalServerErrorException
    ) {
      throw error;
    }

    // Log the error for debugging
    console.error(`${defaultMessage}:`, error);

    // Throw a standardized error
    throw new InternalServerErrorException(
      `${defaultMessage}: ${error.message || 'Unknown error'}`,
    );
  }

  /**
   * Helper method to ensure consistent cart session handling
   */
  private ensureCartSession(
    request: ExpressRequest,
    response: Response,
  ): string {
    // Check if session ID exists in cookies
    const sessionId = request.cookies?.cart_session_id;

    if (sessionId) {
      console.log(`Using existing cart session: ${sessionId}`);
      return sessionId;
    }

    // Create a new session ID if one doesn't exist
    const newSessionId = uuidv4();
    console.log(`Creating new cart session: ${newSessionId}`);

    // Set session ID in HTTP-only cookie using cookieUtil
    this.cookieUtil.setCookie(response, 'cart_session_id', newSessionId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return newSessionId;
  }
}
