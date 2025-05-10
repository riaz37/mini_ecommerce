import { apiClient } from "./client";

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
  return await apiClient("/cart/session", {
    method: "POST",
  });
}

export async function getCart(sessionId?: string): Promise<Cart> {
  const isLoggedIn = !!localStorage.getItem("auth_token") || 
    document.cookie.includes("auth_token=");
  
  return await apiClient(`/cart`, {
    requireAuth: isLoggedIn
  });
}

export async function addToCart(
  productId: string,
  quantity: number,
) {
  // No need to pass sessionId as it's in cookies
  return await apiClient("/cart/add", {
    method: "POST",
    body: { productId, quantity },
  });
}

export async function updateCartItem(
  productId: string,
  quantity: number,
) {
  // No need to pass sessionId as it's in cookies
  return await apiClient(`/cart/items/${productId}`, {
    method: "PUT",
    body: { quantity },
  });
}

export async function removeCartItem(
  productId: string,
) {
  // No need to pass sessionId as it's in cookies
  return await apiClient(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

export async function clearCart() {
  // No need to pass sessionId as it's in cookies
  return await apiClient(`/cart`, {
    method: "DELETE",
  });
}

export async function mergeCart(sessionId: string) {
  return await apiClient("/cart/merge", {
    method: "POST",
    body: { sessionId },
    requireAuth: true,
  });
}
