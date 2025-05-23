"use client";

import React, { useMemo } from "react";
import { useCart } from "@/hooks/useCart";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CartSummary() {
  const { cart, isLoading, clearCart } = useCart();
  const [isClearing, setIsClearing] = React.useState(false);

  // Use useMemo to calculate values only when cart changes
  const { subtotal, shipping, tax, total } = useMemo(() => {
    // Always use values from the backend
    const subtotal = cart.subtotal;
    const tax = cart.tax;

    // Calculate shipping (free over $50)
    const shipping = subtotal > 50 ? 0 : 5.99;

    // Calculate final total with shipping
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }, [cart.subtotal, cart.tax]);

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
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
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
