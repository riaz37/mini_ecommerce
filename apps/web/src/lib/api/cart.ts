import { apiClient } from "./client";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// Create a new cart session
export async function createCartSession(): Promise<{ sessionId: string }> {
  return await apiClient("/cart/session", {
    method: "POST",
  });
}

export async function getCart(): Promise<Cart> {
  // Never require auth for cart operations - we'll send the auth token if available
  return await apiClient(`/cart`);
}

export async function addToCart(
  productId: string,
  quantity: number,
) {
  return await apiClient("/cart/add", {
    method: "POST",
    body: { productId, quantity },
  });
}

export async function updateCartItem(
  productId: string,
  quantity: number,
) {
  return await apiClient(`/cart/items/${productId}`, {
    method: "PUT",
    body: { quantity },
  });
}

export async function removeCartItem(
  productId: string,
) {
  return await apiClient(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

export async function clearCart() {
  return await apiClient(`/cart`, {
    method: "DELETE",
  });
}

