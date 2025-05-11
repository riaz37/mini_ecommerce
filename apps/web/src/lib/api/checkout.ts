import { apiClient } from "./client";

export async function processSuccessfulPayment(sessionId: string) {
  return await apiClient(`/checkout/success?session_id=${sessionId}`);
}

export async function createCheckoutSession(data: {
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
    type: "credit_card" | "paypal" | "bank_transfer";
    details?: any;
  };
}) {
  return await apiClient("/checkout", {
    method: "POST",
    body: data,
  });
}