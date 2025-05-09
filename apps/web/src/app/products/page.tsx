"use client";

import React, { useState } from "react";
import ProductList from "@/components/product/ProductList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [isFiltering, setIsFiltering] = useState(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsFiltering(true);
    setCategoryFilter(e.target.value);
    // Simulate filtering delay
    setTimeout(() => setIsFiltering(false), 800);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsFiltering(true);
    setSortBy(e.target.value);
    // Simulate sorting delay
    setTimeout(() => setIsFiltering(false), 800);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      <div className="flex flex-col sm:flex-row justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="category"
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="border rounded-md p-2 w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home & Kitchen</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sort By
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={handleSortChange}
            className="border rounded-md p-2 w-full sm:w-auto"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="relative">
        {isFiltering && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <LoadingSpinner
              size="lg"
              color="primary"
              text="Updating results..."
            />
          </div>
        )}
        <ProductList />
      </div>
    </div>
  );
}
