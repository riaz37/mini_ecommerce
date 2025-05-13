import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Cart } from '../orders/types/cart.types';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private readonly DEFAULT_CART_TTL = 86400; // 24 hours in seconds

  constructor() {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error(
        'Redis URL is required. Please set REDIS_URL environment variable.',
      );
    }

    this.client = new Redis(redisUrl);

    console.log('Connected to Redis');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value
        ? typeof value === 'string'
          ? (JSON.parse(value) as T)
          : (value as T)
        : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<T> {
    try {
      const jsonValue = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(key, ttl, jsonValue);
      } else {
        await this.client.set(key, jsonValue);
      }
      return value;
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
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
