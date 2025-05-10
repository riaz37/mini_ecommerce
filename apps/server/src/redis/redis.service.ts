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
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));

    await this.client.connect();
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
    return this.del(key);
  }
}
