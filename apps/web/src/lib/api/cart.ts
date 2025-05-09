import { apiClient } from './client';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Create a new cart session
export async function createCartSession(): Promise<{ sessionId: string }> {
  return await apiClient('/cart/session', {
    method: 'POST',
  });
}

export async function getCart(sessionId: string): Promise<Cart> {
  return await apiClient(`/cart?sessionId=${sessionId}`);
}

export async function addToCart(sessionId: string, productId: string, quantity: number) {
  return await apiClient('/cart', {
    method: 'POST',
    body: { sessionId, productId, quantity },
  });
}

export async function updateCartItem(sessionId: string, productId: string, quantity: number) {
  return await apiClient(`/cart/items/${productId}`, {
    method: 'PUT',
    body: { sessionId, quantity },
  });
}

export async function removeCartItem(sessionId: string, productId: string) {
  return await apiClient(`/cart/items/${productId}?sessionId=${sessionId}`, {
    method: 'DELETE',
  });
}

export async function clearCart(sessionId: string) {
  return await apiClient(`/cart?sessionId=${sessionId}`, {
    method: 'DELETE',
  });
}

export async function mergeCart(sessionId: string) {
  return await apiClient('/cart/merge', {
    method: 'POST',
    body: { sessionId },
    requireAuth: true,
  });
}
