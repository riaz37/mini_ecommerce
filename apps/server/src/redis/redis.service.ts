import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Cart } from '../orders/types/cart.types';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: RedisClientType;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private readonly DEFAULT_CART_TTL = 86400; // 24 hours in seconds

  constructor() {}

  async onModuleInit() {
    // Get Redis URL from environment variables, with Upstash URL as fallback
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      // Add Upstash specific configuration if needed
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));

    await this.client.connect();
    console.log('Connected to Redis at:', redisUrl.replace(/:[^:]*@/, ':***@')); // Hide password in logs
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    await this.client.set(key, JSON.stringify(value), { EX: ttl });
    return value;
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return this.client.expire(key, ttl);
  }

  // Cart-specific methods
  async getCart(sessionId: string): Promise<Cart | null> {
    // Normalize the key format to handle both user and session carts
    const key = sessionId.startsWith('cart:') ? sessionId : `cart:${sessionId}`;
    const cart = await this.get<Cart>(key);

    // Refresh TTL on every cart access if cart exists
    if (cart) {
      await this.expire(key, this.DEFAULT_CART_TTL);
    }

    return cart;
  }

  async setCart(
    sessionId: string,
    cart: Cart,
    ttl: number = this.DEFAULT_CART_TTL,
  ): Promise<Cart> {
    // Normalize the key format to handle both user and session carts
    const key = sessionId.startsWith('cart:') ? sessionId : `cart:${sessionId}`;
    return this.set<Cart>(key, cart, ttl);
  }

  async deleteCart(sessionId: string): Promise<number> {
    // Normalize the key format to handle both user and session carts
    const key = sessionId.startsWith('cart:') ? sessionId : `cart:${sessionId}`;
    console.log(`Deleting cart with key: ${key}`);
    return this.del(key);
  }
}
