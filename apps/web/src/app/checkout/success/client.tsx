"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { processSuccessfulPayment } from "@/lib/api/checkout";
import { useCart } from "@/hooks/useCart";

const formatCurrency = (value: any): string => {
  const numValue = typeof value === 'number' 
    ? value 
    : typeof value === 'string'
      ? parseFloat(value)
      : 0;
  
  return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
};

export default function CheckoutSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const { clearCart } = useCart();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setError("Missing session information. Please contact customer support.");
      setLoading(false);
      return;
    }

    const processPayment = async () => {
      try {
        setLoading(true);
        console.log(`Processing payment for session: ${sessionId}`);

        // Single call to process the payment
        const orderData = await processSuccessfulPayment(sessionId);

        if (orderData) {
          console.log("Order data received:", orderData);
          setOrder(orderData);
          
          // No need to clear cart here as it's handled by the backend
          console.log("Cart already cleared by the backend");
        } else {
          throw new Error("No order data received");
        }
      } catch (err) {
        console.error("Error processing payment:", err);
        const errorMessage = err instanceof Error 
          ? `Error: ${err.message}` 
          : "Failed to process payment. Please contact customer support.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  // Auto-redirect to home after success
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;
    
    if (order && !error) {
      redirectTimer = setTimeout(() => {
        router.push("/");
      }, 5000); // Redirect after 5 seconds
    }
    
    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [order, error, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="Processing your payment..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-3xl font-light mb-4">Payment Error</h1>
          <p className="text-red-600 mb-8">{error}</p>
          <Button onClick={() => router.push("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-light mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        {order && (
          <div className="mb-6 text-left bg-gray-50 p-4 rounded-lg">
            <h2 className="font-medium mb-2">Order Details</h2>
            <p className="text-sm text-gray-600">Order ID: {order.id}</p>
            <p className="text-sm text-gray-600">
              Total: ${formatCurrency(order.total)}
            </p>
          </div>
        )}
        <p className="text-gray-500 text-sm mb-6">
          Redirecting to homepage in a few seconds...
        </p>
        <div className="flex justify-center">
          <Button onClick={() => router.push("/")}>Return to Home</Button>
        </div>
      </div>
    </div>
  );
}
