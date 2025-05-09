import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client;

  // Default TTL for cart data (24 hours)
  private readonly DEFAULT_CART_TTL = 60 * 60 * 24;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  async get(key: string) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number) {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, stringValue, { EX: ttl });
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }

  // Cart-specific methods
  async getCart(sessionId: string) {
    return this.get(`cart:${sessionId}`);
  }

  async setCart(
    sessionId: string,
    cart: any,
    ttl: number = this.DEFAULT_CART_TTL,
  ) {
    return this.set(`cart:${sessionId}`, cart, ttl);
  }

  async deleteCart(sessionId: string) {
    return this.del(`cart:${sessionId}`);
  }

  // Set expiry on existing key
  async expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }
}
