import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getCart(sessionId: string) {
    // Get cart from Redis
    const cart = await this.redisService.getCart(sessionId);
    
    if (!cart) {
      return { items: [], total: 0 };
    }
    
    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    
    // Refresh TTL on cart access
    await this.redisService.expire(`cart:${sessionId}`, 60 * 60 * 24);
    
    return { ...cart, total };
  }

  async addToCart(addToCartDto: AddToCartDto) {
    const { sessionId, productId, quantity } = addToCartDto;

    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get current cart or create new one
    const cart = await this.redisService.getCart(sessionId) || { items: [] };

    // Add or update item in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: parseFloat(product.price.toString()),
        name: product.name,
      });
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Save cart to Redis with TTL
    await this.redisService.setCart(sessionId, cart);

    return { ...cart, total };
  }

  async updateCartItem(sessionId: string, productId: string, quantity: number) {
    const cartKey = `cart:${sessionId}`;
    const cart = await this.redisService.get(cartKey);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      throw new NotFoundException('Item not found in cart');
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Save updated cart to Redis
    await this.redisService.set(cartKey, cart, 60 * 60 * 24);

    return { ...cart, total };
  }

  async removeCartItem(sessionId: string, productId: string) {
    const cartKey = `cart:${sessionId}`;
    const cart = await this.redisService.get(cartKey);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.productId !== productId);

    if (cart.items.length === initialLength) {
      throw new NotFoundException('Item not found in cart');
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Save updated cart to Redis
    await this.redisService.set(cartKey, cart, 60 * 60 * 24);

    return { ...cart, total };
  }

  async clearCart(sessionId: string) {
    const cartKey = `cart:${sessionId}`;
    await this.redisService.del(cartKey);
    return { items: [], total: 0 };
  }

  async checkout(checkoutDto: CheckoutDto) {
    const { sessionId, customerId } = checkoutDto;

    // Get cart from Redis
    const cartKey = `cart:${sessionId}`;
    const cart = await this.redisService.get(cartKey);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    // Check if customer exists
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order in database
    const order = await this.prisma.order.create({
      data: {
        customerId,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Clear cart from Redis
    await this.redisService.del(cartKey);

    return order;
  }
}
