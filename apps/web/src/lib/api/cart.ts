import { apiClient } from "./client";
import { Cart } from "@/lib/types";

// Create a cart session
export async function createCartSession(): Promise<{ sessionId: string }> {
  return await apiClient("/cart/session", { method: "POST" });
}

// Get cart contents
export async function getCart(): Promise<Cart> {
  // Let the backend handle session creation if needed
  return await apiClient("/cart");
}

// Add item to cart
export async function addToCart(
  productId: string,
  quantity: number,
): Promise<Cart> {
  return await apiClient("/cart/add", {
    method: "POST",
    body: { productId, quantity },
  });
}

// Update cart item quantity
export async function updateCartItem(
  productId: string,
  quantity: number,
): Promise<Cart> {
  return await apiClient(`/cart/items/${productId}`, {
    method: "PUT",
    body: { quantity },
  });
}

// Remove item from cart
export async function removeCartItem(productId: string): Promise<Cart> {
  return await apiClient(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

// Clear entire cart
export async function clearCart() {
  return await apiClient(`/cart`, {
    method: "DELETE",
  });
}

// Merge guest cart with user cart after login
export async function mergeCart(): Promise<Cart> {
  return await apiClient("/cart/merge", {
    method: "POST",
    requireAuth: true,
  });
}
