import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { Redis } from '@upstash/redis';
import { Cart } from '../orders/types/cart.types';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: RedisClientType | Redis;
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds
  private readonly DEFAULT_CART_TTL = 86400; // 24 hours in seconds
  private useUpstash = false;

  constructor() {}

  async onModuleInit() {
    // Check if Upstash credentials are provided
    const upstashUrl = process.env.UPSTASH_REDIS_URL;
    const upstashToken = process.env.UPSTASH_REDIS_TOKEN;
    
    if (upstashUrl && upstashToken) {
      // Use Upstash Redis SDK
      this.client = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
      this.useUpstash = true;
      console.log('Connected to Upstash Redis');
      return;
    }
    
    // Fall back to Redis client
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });

    (this.client as RedisClientType).on('error', (err) => console.error('Redis Client Error', err));

    await (this.client as RedisClientType).connect();
    console.log('Connected to Redis at:', redisUrl.replace(/:[^:]*@/, ':***@')); // Hide password in logs
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      let value;
      
      if (this.useUpstash) {
        value = await (this.client as Redis).get(key);
      } else {
        value = await (this.client as RedisClientType).get(key);
      }
      
      return value ? (typeof value === 'string' ? JSON.parse(value) : value) : null;
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
      
      if (this.useUpstash) {
        await (this.client as Redis).set(key, jsonValue, { ex: ttl });
      } else {
        await (this.client as RedisClientType).set(key, jsonValue, { EX: ttl });
      }
      
      return value;
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (this.useUpstash) {
        return await (this.client as Redis).del(key);
      } else {
        return await (this.client as RedisClientType).del(key);
      }
    } catch (error) {
      console.error('Redis del error:', error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (this.useUpstash) {
        const result = await (this.client as Redis).expire(key, ttl);
        return result === 1;
      } else {
        return await (this.client as RedisClientType).expire(key, ttl);
      }
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
