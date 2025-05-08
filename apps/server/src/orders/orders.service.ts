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
    const cartKey = `cart:${sessionId}`;
    const cart = (await this.redisService.get(cartKey)) || { items: [] };

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

    // Save cart to Redis with 24 hour expiry
    await this.redisService.set(cartKey, cart, 60 * 60 * 24);

    return cart;
  }

  async checkout(checkoutDto: CheckoutDto) {
    const { sessionId, customerId } = checkoutDto;

    // Get cart from Redis
    const cartKey = `cart:${sessionId}`;
    const cart = await this.redisService.get(cartKey);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
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
