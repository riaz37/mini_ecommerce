'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';

export default function CartPage() {
  const { cart, isLoading, error } = useCart();

  // Show loading state when cart is empty and loading
  if (cart.items.length === 0 && isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              <Skeleton variant="text" className="w-3/4 mb-4" height={20} />
              <Skeleton variant="rectangular" className="w-full mb-4" height={80} />
              <Skeleton variant="rectangular" className="w-full mb-4" height={80} />
              <Skeleton variant="rectangular" className="w-full" height={80} />
            </div>
          </div>
          <div className="md:col-span-1">
            <Skeleton variant="card" className="w-full" height={250} />
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart state
  if (cart.items.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link 
            href="/products" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4">
            {cart.items.map((item) => (
              <CartItem key={item.productId} item={item} />
            ))}
          </div>
          
          <div className="mt-6">
            <Link 
              href="/products" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <CartSummary />
          
          <div className="mt-4">
            <Link
              href="/checkout"
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium block text-center ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={(e) => isLoading && e.preventDefault()}
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
