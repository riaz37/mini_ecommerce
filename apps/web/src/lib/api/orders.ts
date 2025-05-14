import { apiClient } from "./client";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    fullName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: {
    type: "credit_card";
    details: any;
  };
}

export async function getOrders() {
  return await apiClient("/orders", { requireAuth: true });
}

export async function getOrderById(id: string) {
  return await apiClient(`/orders/${id}`, { requireAuth: true });
}

export async function createOrder(data: {
  sessionId: string;
  shippingAddress: {
    fullName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: {
    type: "credit_card";
    details?: any;
  };
}) {
  return await apiClient("/orders", {
    method: "POST",
    body: data,
    requireAuth: true,
  });
}

export async function cancelOrder(id: string) {
  return await apiClient(`/orders/${id}/cancel`, {
    method: "POST",
    requireAuth: true,
  });
}

export async function getUserOrders() {
  return await apiClient("user/orders", { requireAuth: true });
}
