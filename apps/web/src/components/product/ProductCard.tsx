// @ts-nocheck
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Ensure inStock is properly set
  const isInStock =
    product.inStock !== undefined ? product.inStock : product.stock > 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isInStock) return;

    setIsAddingToCart(true);
    try {
      await addItem(product, 1);
      // Toast is handled in the useCart hook
    } catch (error) {
      console.error("Error adding to cart:", error);
      // Error toast is handled in the useCart hook
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
        {/* Product image would go here */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Product Image
        </div>

        {/* Out of stock overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
            <span className="px-3 py-1 bg-gray-800 text-white text-sm font-medium rounded">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        <p className="mt-1 text-gray-600 line-clamp-2 text-sm h-10">
          {product.description}
        </p>

        <div className="mt-2 flex items-center">
          {product.rating && (
            <div className="flex items-center mr-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? "fill-current"
                        : "text-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-1">
                {product.rating.toFixed(1)}
              </span>
            </div>
          )}

          {product.reviewCount && (
            <span className="text-xs text-gray-500">
              ({product.reviewCount}{" "}
              {product.reviewCount === 1 ? "review" : "reviews"})
            </span>
          )}
        </div>

        <div className="mt-2 flex justify-between items-center">
          <p className="text-lg font-bold text-gray-900">
            $
            {typeof product.price === "number"
              ? product.price.toFixed(2)
              : parseFloat(product.price).toFixed(2)}
          </p>

          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isInStock}
            className={`p-2 rounded-full ${
              isInStock
                ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isAddingToCart ? (
              <LoadingSpinner size="xs" color="white" />
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
