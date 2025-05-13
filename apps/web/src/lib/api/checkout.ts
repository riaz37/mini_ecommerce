import { apiClient } from "./client";
import { ShippingAddress, PaymentMethod } from "@/lib/types";

export async function processSuccessfulPayment(sessionId: string) {
  console.log(`Calling API to process payment for session: ${sessionId}`);
  try {
    // Use the correct endpoint path
    const result = await apiClient(`/checkout/success?session_id=${sessionId}`);
    return result;
  } catch (error) {
    console.error("API error in processSuccessfulPayment:", error);
    throw error;
  }
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
