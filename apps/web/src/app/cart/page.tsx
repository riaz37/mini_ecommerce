"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Skeleton from "@/components/ui/Skeleton";
import { ShoppingCart, ShoppingBag, AlertCircle } from "lucide-react";

export default function CartPage() {
  const { cart, isLoading, error } = useCart();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Force refresh when user changes
  useEffect(() => {
    if (user?.id) {
      console.log("User logged in, refreshing cart page");
      setRefreshKey(prev => prev + 1);
    }
  }, [user?.id]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <ShoppingCart className="mr-3 h-8 w-8 text-blue-600" />
          Your Cart
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <Skeleton variant="text" className="w-3/4 mb-6" height={24} />
              <Skeleton
                variant="rectangular"
                className="w-full mb-6"
                height={100}
              />
              <Skeleton
                variant="rectangular"
                className="w-full mb-6"
                height={100}
              />
              <Skeleton variant="rectangular" className="w-full" height={100} />
            </div>
          </div>
          <div className="md:col-span-1">
            <Skeleton variant="card" className="w-full" height={300} />
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart state
  if (cart.items.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center">
          <ShoppingCart className="mr-3 h-8 w-8 text-blue-600" />
          Your Cart
        </h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-4">
              <ShoppingBag className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven&apos;t added anything to your cart yet. Browse
            our products and find something you&apos;ll love!
          </p>
          <Link
            href="/products"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        <ShoppingCart className="mr-3 h-8 w-8 text-blue-600" />
        Your Cart ({cart.items.length}{" "}
        {cart.items.length === 1 ? "item" : "items"})
      </h1>

      {error && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-start"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-1">{error.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Cart Items</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {cart.items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <Link
                href="/products"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CartSummary />

            <div className="mt-6">
              <Link
                href="/checkout"
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium block text-center cursor-pointer ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={(e) => isLoading && e.preventDefault()}
              >
                Proceed to Checkout
              </Link>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-blue-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium mb-1">Secure Checkout</p>
                  <p>Your payment information is processed securely.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
