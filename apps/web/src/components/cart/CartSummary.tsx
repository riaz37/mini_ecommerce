"use client";

import React from "react";
import { useCart } from "@/hooks/useCart";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CartSummary() {
  const { cart, isLoading, clearCart } = useCart();
  const [isClearing, setIsClearing] = React.useState(false);

  // Use values from the cart
  const subtotal = cart.subtotal || cart.total;
  const tax = cart.tax || subtotal * 0.08;

  // Calculate shipping (free over $50)
  const shipping = subtotal > 50 ? 0 : 5.99;

  // Calculate total
  const total = cart.total || subtotal + shipping + tax;

  const handleClearCart = async () => {
    setIsClearing(true);
    await clearCart();
    setIsClearing(false);
  };

  return (
    <LoadingOverlay isLoading={isLoading && !isClearing} blur={true}>
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (8%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleClearCart}
              disabled={isClearing || cart.items.length === 0}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isClearing ? (
                <LoadingSpinner size="sm" color="white" text="Clearing..." />
              ) : (
                "Clear Cart"
              )}
            </button>
          </div>
        </div>
      </div>
    </LoadingOverlay>
  );
}
