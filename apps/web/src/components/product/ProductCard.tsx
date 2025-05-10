"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import Rating from "@/components/ui/Rating";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      await addItem(product, 1);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
      <Link href={`/products/${product.id}`}>
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {/* Placeholder for product image */}
          <span className="text-gray-400">Product Image</span>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center">
          <Rating value={product.rating || 0} />
          <span className="ml-1 text-sm text-gray-500">
            ({product.reviewCount || 0} reviews)
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-gray-900 font-bold">
            ${typeof product.price === 'number' 
              ? product.price.toFixed(2) 
              : parseFloat(product.price).toFixed(2)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-md disabled:bg-blue-400 flex items-center justify-center min-w-[80px]"
          >
            {isAddingToCart ? (
              <LoadingSpinner size="xs" color="white" />
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
