import { apiClient } from "./client";
import { ShippingAddress, PaymentMethod } from "@/lib/types";

export async function processSuccessfulPayment(sessionId: string) {
  return await apiClient(`/checkout/success?session_id=${sessionId}`);
}

export async function createCheckoutSession(data: {
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
}) {
  return await apiClient("/checkout", {
    method: "POST",
    body: data,
  });
}

export async function getOrderById(orderId: string) {
  return await apiClient(`/orders/${orderId}`);
}
