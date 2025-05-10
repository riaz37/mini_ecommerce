"use client";

import React, { useState, useEffect } from "react";
import ProductList from "@/components/product/ProductList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ProductFilters, Category } from "@/lib/types";
import { getCategories } from "@/lib/api/categories";

export default function ProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch categories from the API
  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoadingCategories(true);
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    }

    fetchCategories();
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    setIsFiltering(true);
    
    // Create the filter object
    const newFilters: ProductFilters = {
      ...(categoryFilter !== "all" ? { categoryId: categoryFilter } : {}),
      minPrice,
      maxPrice,
      ...(sortBy !== "featured" ? { 
        sortBy: sortBy === "price-low" ? "price" : 
                sortBy === "price-high" ? "price" : 
                sortBy === "newest" ? "createdAt" : 
                sortBy === "rating" ? "rating" : undefined,
        sortOrder: sortBy === "price-high" ? "desc" : 
                  sortBy === "price-low" ? "asc" : 
                  sortBy === "newest" ? "desc" : 
                  sortBy === "rating" ? "desc" : undefined
      } : {})
    };
    
    // Short delay to show loading state
    const timer = setTimeout(() => {
      setFilters(newFilters);
      setIsFiltering(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [categoryFilter, minPrice, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-light tracking-tight mb-8">Products</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-medium text-lg mb-4">Filters</h2>
            
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Category</h3>
                {isLoadingCategories ? (
                  <div className="py-2">
                    <LoadingSpinner size="sm" color="primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="all"
                        checked={categoryFilter === "all"}
                        onChange={() => setCategoryFilter("all")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Categories</span>
                    </label>
                    
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={categoryFilter === category.id}
                          onChange={() => setCategoryFilter(category.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Price Range */}
              <div>
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Price Range</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Min</label>
                    <input
                      type="number"
                      min="0"
                      max={maxPrice}
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md shadow-sm text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Max</label>
                    <input
                      type="number"
                      min={minPrice}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md shadow-sm text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sort By */}
              <div>
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm text-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
              
              {/* Reset Filters */}
              <button
                onClick={() => {
                  setCategoryFilter("all");
                  setMinPrice(0);
                  setMaxPrice(1000);
                  setSortBy("featured");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md text-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          <div className="relative min-h-[400px]">
            {isFiltering && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center transition-opacity duration-300 ease-in-out">
                <LoadingSpinner
                  size="lg"
                  color="primary"
                  text="Updating results..."
                />
              </div>
            )}
            <ProductList initialFilters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
