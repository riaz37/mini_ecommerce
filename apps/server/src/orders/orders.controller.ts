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
  async createCartSession(@Res({ passthrough: true }) response: Response, @Req() request: ExpressRequest) {
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
      return { message: 'No guest cart to merge', items: [], subtotal: 0, tax: 0, total: 0 };
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
  @Get('checkout/success')
  async handleStripeSuccess(
    @Query('session_id') stripeSessionId: string,
    @Req() request: ExpressRequest,
  ) {
    try {
      if (!stripeSessionId) {
        throw new BadRequestException('Missing Stripe session ID');
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      // Retrieve the Stripe checkout session with expanded payment intent
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ['payment_intent'],
      });

      // Verify the payment was successful
      if (session.payment_status !== 'paid') {
        throw new BadRequestException('Payment not completed');
      }

      // Get cart session ID from metadata
      const cartSessionId = session.metadata.sessionId;
      if (!cartSessionId) {
        throw new BadRequestException('Invalid session data');
      }

      // Verify that this cart session belongs to the current user/session
      const cookies = request.cookies;
      const currentSessionId = cookies?.cart_session_id;

      // If the current session doesn't match the one used to create the order,
      // we'll still process it but log a warning as this could indicate session hijacking
      if (currentSessionId && currentSessionId !== cartSessionId) {
        console.warn(
          `Session mismatch in Stripe checkout: ${currentSessionId} vs ${cartSessionId}`,
        );
      }

      // Create order from the session metadata
      const { customerId, shippingAddress } = session.metadata;

      if (!shippingAddress) {
        throw new BadRequestException('Missing shipping address');
      }

      // Create order in database
      const order = await this.ordersService.checkout({
        sessionId: cartSessionId,
        customerId: customerId || undefined,
        shippingAddress: JSON.parse(shippingAddress),
        paymentMethod: {
          type: PaymentMethodType.CREDIT_CARD,
          details: {
            paymentIntentId: session.payment_intent?.id,
            paymentMethod: session.payment_intent?.payment_method,
          },
        },
        stripeSession: session,
      });

      return order;
    } catch (error) {
      this.handleControllerError(error, 'Failed to process Stripe payment');
    }
  }

  // Add a new webhook endpoint for Stripe events
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @Post('webhook/stripe')
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      // Verify the event using the signature
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;

          // Process the successful checkout
          await this.processSuccessfulCheckout(session);
          break;

        case 'payment_intent.payment_failed':
          const paymentIntent = event.data.object;
          console.log(`Payment failed: ${paymentIntent.id}`);
          // Handle failed payment (e.g., notify customer)
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  // Helper method to process successful checkout
  private async processSuccessfulCheckout(session: any) {
    // Get cart session ID from metadata
    const cartSessionId = session.metadata.sessionId;
    const customerId = session.metadata.customerId;
    const shippingAddress = session.metadata.shippingAddress;

    if (!cartSessionId || !shippingAddress) {
      throw new BadRequestException('Invalid session data');
    }

    // Create order in database
    await this.ordersService.checkout({
      sessionId: cartSessionId,
      customerId: customerId || undefined,
      shippingAddress: JSON.parse(shippingAddress),
      paymentMethod: {
        type: PaymentMethodType.CREDIT_CARD,
        details: {
          paymentIntentId: session.payment_intent,
        },
      },
      stripeSession: session,
    });
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
    response: Response
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
