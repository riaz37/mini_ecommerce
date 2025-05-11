"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCategoryById, getCategoryProducts } from "@/lib/api/categories";
import { Category, Product } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useCart } from "@/hooks/useCart";

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const { addItem } = useCart();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchCategoryData() {
      try {
        setLoading(true);
        const categoryData = await getCategoryById(categoryId);
        setCategory(categoryData);

        const productsData = await getCategoryProducts(categoryId);
        setProducts(productsData);

        setError(null);
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError("Failed to load category details. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    if (categoryId) {
      fetchCategoryData();
    }
  }, [categoryId]);

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    
    try {
      await addItem(product, 1);
      // Success is handled by the cart context
    } catch (err) {
      console.error("Error adding to cart:", err);
      // Error is handled by the cart context
    } finally {
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <LoadingSpinner
          size="xl"
          color="primary"
          text="Loading category details..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 max-w-2xl w-full">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link href="/" className="mt-4 text-blue-600 hover:text-blue-800">
          Return to Home
        </Link>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="mb-4">
          The category you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Categories
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">{category?.name}</h1>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            // Ensure inStock is properly set
            const isInStock = product.inStock !== undefined 
              ? product.inStock 
              : (product.stock > 0);
            
            return (
              <div
                key={product.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <Link href={`/products/${product.id}`} className="cursor-pointer">
                  <div className="aspect-video bg-gray-200 relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      ${typeof product.price === 'number' 
                        ? product.price.toFixed(2) 
                        : parseFloat(product.price).toFixed(2)}
                    </span>
                    <button 
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={addingToCart[product.id] || !isInStock}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center min-w-[80px]"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      {addingToCart[product.id] ? (
                        <LoadingSpinner size="xs" color="white" />
                      ) : isInStock ? (
                        "Add to Cart"
                      ) : (
                        "Out of Stock"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600">
            No products found in this category
          </h2>
          <p className="mt-2 text-gray-500">
            Check back later for new products.
          </p>
        </div>
      )}
    </div>
  );
}
