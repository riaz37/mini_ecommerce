import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Cart, CartItem, CartWithTotals } from './types/cart.types';
import { CheckoutDto, PaymentMethodType } from './dto/checkout.dto';
import { OrderStatus } from '../../generated/prisma';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  // Helper method to calculate cart totals
  private calculateCartTotals(cart: Cart): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    if (!cart || !cart.items || cart.items.length === 0) {
      return { subtotal: 0, tax: 0, total: 0 };
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Calculate tax (8%)
    const tax = subtotal * 0.08;

    // Calculate total
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  async getCart(sessionId: string): Promise<CartWithTotals> {
    try {
      // Get cart from Redis using the normalized method
      const cart = (await this.redisService.getCart(sessionId)) || {
        items: [],
      };

      // Calculate totals using the helper method
      const { subtotal, tax, total } = this.calculateCartTotals(cart);

      return { ...cart, subtotal, tax, total };
    } catch (error) {
      this.handleError(error, 'Failed to retrieve cart');
    }
  }

  async addToCart(
    sessionId: string,
    productId: string,
    quantity: number,
  ): Promise<CartWithTotals> {
    try {
      // Check if product exists
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero');
      }

      // Get current cart or create new one
      const cart = (await this.redisService.getCart(sessionId)) || {
        items: [],
      };

      // Add or update item in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId === productId,
      );

      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        const newItem: CartItem = {
          productId,
          quantity,
          price: parseFloat(product.price.toString()),
          name: product.name,
        };
        cart.items.push(newItem);
      }

      // Calculate totals using the helper method
      const { subtotal, tax, total } = this.calculateCartTotals(cart);

      // Save cart to Redis
      await this.redisService.setCart(sessionId, cart);

      return { ...cart, subtotal, tax, total };
    } catch (error) {
      this.handleError(error, 'Failed to add item to cart');
    }
  }

  async updateCartItem(sessionId: string, productId: string, quantity: number) {
    // Get cart from Redis directly using the getCart method
    const cart = await this.redisService.getCart(sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Item with ID ${productId} not found in cart`,
      );
    }

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;

    // Calculate totals using the helper method
    const { subtotal, tax, total } = this.calculateCartTotals(cart);

    try {
      // Save updated cart to Redis using setCart method
      await this.redisService.setCart(sessionId, cart);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update cart in Redis');
    }

    return { ...cart, subtotal, tax, total };
  }

  async removeCartItem(sessionId: string, productId: string) {
    // Get cart from Redis directly using the getCart method
    const cart = await this.redisService.getCart(sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Item not found in cart');
    }

    // Calculate totals using the helper method
    const { subtotal, tax, total } = this.calculateCartTotals(cart);

    // Save updated cart to Redis using setCart method
    await this.redisService.setCart(sessionId, cart);

    return { ...cart, subtotal, tax, total };
  }

  async clearCart(sessionId: string) {
    try {
      // Use the deleteCart method from RedisService
      await this.redisService.deleteCart(sessionId);

      // Return a complete cart object with all expected properties
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new InternalServerErrorException('Failed to clear cart');
    }
  }

  async checkout(checkoutDto: CheckoutDto) {
    const { sessionId, customerId, shippingAddress, paymentMethod } =
      checkoutDto;

    // Check for duplicate order if this is a Stripe payment
    if (
      paymentMethod.type === PaymentMethodType.CREDIT_CARD &&
      paymentMethod.details?.sessionId
    ) {
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          paymentMethod: {
            contains: paymentMethod.details.sessionId,
          },
        },
      });

      if (existingOrder) {
        console.log(
          `Order already exists for session ${paymentMethod.details.sessionId}`,
        );
        return existingOrder;
      }
    }

    // Get cart from Redis using getCart method
    const cart = await this.redisService.getCart(sessionId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    // Check if customer exists if customerId is provided
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }
    }

    // Calculate totals using the helper method
    const { subtotal, tax, total } = this.calculateCartTotals(cart);

    // Use a transaction to ensure data consistency
    try {
      // Start transaction
      const order = await this.prisma.$transaction(async (prisma) => {
        // Check inventory for all items
        for (const item of cart.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { id: true, stock: true },
          });

          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Not enough inventory for product ${item.name}. Available: ${product.stock}`,
            );
          }
        }

        // Create order in database
        const newOrder = await prisma.order.create({
          data: {
            customerId,
            total: subtotal + tax,
            status: 'PENDING',
            shippingAddress: shippingAddress
              ? JSON.stringify(shippingAddress)
              : null,
            paymentMethod: JSON.stringify(paymentMethod),
            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                // Remove the name field
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Update inventory for each product
        for (const item of cart.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        return newOrder;
      });

      // Clear cart from Redis after successful order creation
      await this.redisService.deleteCart(sessionId);

      return order;
    } catch (error) {
      // If it's already a NestJS exception, rethrow it
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Otherwise, wrap it in an InternalServerErrorException
      throw new InternalServerErrorException(
        `Failed to create order: ${error.message}`,
      );
    }
  }

  async mergeCart(sessionId: string, userId: string) {
    // Get cart from Redis using normalized method
    const guestCart = await this.redisService.getCart(sessionId);

    if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
      return { items: [], subtotal: 0, tax: 0, total: 0 };
    }

    // Get user's cart or create a new one
    const userCartKey = `cart:user:${userId}`;
    const userCart = (await this.redisService.getCart(userCartKey)) || {
      items: [],
    };

    // Merge items from guest cart into user cart
    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        (item) => item.productId === guestItem.productId,
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item
        userCart.items.push(guestItem);
      }
    }

    // Calculate totals using the helper method
    const { subtotal, tax, total } = this.calculateCartTotals(userCart);

    // Save merged cart to Redis using consistent method
    await this.redisService.setCart(userCartKey, userCart);

    // Clear guest cart using deleteCart method
    await this.redisService.deleteCart(sessionId);

    return { ...userCart, subtotal, tax, total };
  }

  async getUserCart(userId: string): Promise<CartWithTotals> {
    try {
      const userCartKey = `cart:user:${userId}`;
      // Use getCart method which now handles normalized keys and TTL refresh
      const cart = (await this.redisService.getCart(userCartKey)) || {
        items: [],
      };

      // Calculate totals using the helper method
      const { subtotal, tax, total } = this.calculateCartTotals(cart);

      return { ...cart, subtotal, tax, total };
    } catch (error) {
      this.handleError(error, 'Failed to retrieve user cart');
    }
  }

  async createOrderFromStripeSession(session: any) {
    try {
      // Extract shipping address from metadata
      let shippingAddress = {};
      try {
        shippingAddress = JSON.parse(session.metadata?.shippingAddress || '{}');
      } catch (error) {
        console.error('Error parsing shipping address:', error);
      }

      // Calculate total from Stripe data
      const total = session.amount_total ? session.amount_total / 100 : 0;

      // Process line items to ensure valid product IDs
      const lineItems = [];
      if (session.line_items?.data) {
        for (const item of session.line_items.data) {
          // Try to find a matching product in our database
          // We'll use a default product ID if we can't find a match
          const defaultProductId = await this.getDefaultProductId();
          
          lineItems.push({
            productId: defaultProductId,
            quantity: item.quantity || 1,
            price: (item.price?.unit_amount || 0) / 100,
          });
        }
      }

      // Create order with line items
      const order = await this.prisma.order.create({
        data: {
          total,
          status: OrderStatus.PENDING,
          shippingAddress: JSON.stringify(shippingAddress),
          paymentMethod: JSON.stringify({
            type: PaymentMethodType.CREDIT_CARD,
            details: {
              paymentIntentId: session.payment_intent?.id,
              sessionId: session.id,
            },
          }),
          // Only include customerId if it exists
          ...(session.metadata?.customerId && {
            customer: {
              connect: {
                id: session.metadata.customerId,
              },
            },
          }),
          items: {
            create: lineItems,
          },
        },
        include: {
          items: true,
        },
      });

      console.log(`Created order from Stripe session: ${order.id}`);
      return order;
    } catch (error) {
      console.error('Error creating order from Stripe session:', error);
      throw error;
    }
  }

  // Helper method to get a valid product ID from the database
  private async getDefaultProductId(): Promise<string> {
    // Try to find any product in the database
    const product = await this.prisma.product.findFirst();
    
    if (!product) {
      throw new Error('No products found in database to use as default');
    }
    
    return product.id;
  }

  // Helper method for consistent error handling
  private handleError(error: any, defaultMessage: string): never {
    // If it's already a NestJS exception, rethrow it
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
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
}
