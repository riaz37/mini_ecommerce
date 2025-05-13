"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getProductById, getProductRatings } from "@/lib/api/products";
import { Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchProductData() {
      setLoading(true);
      try {
        // Fetch product details - normalization happens in apiClient
        const productData = await getProductById(id as string);
        setProduct(productData);

        // Fetch product ratings
        const ratingsData = await getProductRatings(id as string);
        setRatings(ratingsData);

        setError(null);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Failed to load product details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchProductData();
  }, [id]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value, 10));
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addItem(product, quantity);
        // Toast is now handled in the useCart hook
      } catch (error) {
        console.error("Error adding to cart:", error);
        // Error toast is handled in the useCart hook
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="Loading product details..."
        />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error || "Product not found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-gray-100 rounded-xl flex items-center justify-center h-96 md:h-auto">
            <span className="text-gray-400">Product Image</span>
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="flex items-center mb-6">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating || 0) ? "fill-current" : "text-gray-300"}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                ({product.reviewCount} reviews)
              </span>
            </div>

            <p className="text-3xl font-bold text-gray-900 mb-6">
              $
              {typeof product.price === "number"
                ? product.price.toFixed(2)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                : parseFloat(product.price as any).toFixed(2)}
            </p>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Description
              </h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Availability
              </h3>
              <p
                className={`${product.inStock ? "text-green-600" : "text-red-600"} font-medium`}
              >
                {product.inStock ? "In Stock" : "Out of Stock"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="w-full sm:w-1/3">
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quantity
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!product.inStock}
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full sm:w-2/3 py-3 px-6 rounded-lg font-medium ${
                  product.inStock
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                } transition-colors`}
              >
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Customer Reviews
              </h3>

              {ratings.length > 0 ? (
                <div className="space-y-6">
                  {ratings.map((rating, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-6 last:border-b-0"
                    >
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < rating.value ? "fill-current" : "text-gray-300"}`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {rating.customerName}
                        </span>
                      </div>
                      <p className="text-gray-600">{rating.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
