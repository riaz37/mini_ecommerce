"use client";

import React, { useState, useEffect } from "react";
import type { ProductFilters } from "@/lib/types";
import { getCategories } from "@/lib/api/categories";

interface ProductFiltersProps {
  filters: ProductFilters;
  updateFilters: (filters: Partial<ProductFilters>) => void;
}

export default function ProductFilters({
  filters,
  updateFilters,
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 1000,
  });
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [rating, setRating] = useState(filters.minRating ?? 0);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    }

    fetchCategories();
  }, []);

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        updateFilters({ search: searchTerm });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, updateFilters]);

  // Handle price range change
  const handlePriceChange = () => {
    updateFilters({
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ categoryId: e.target.value || undefined });
  };

  // Handle rating change
  const handleRatingChange = (value: number) => {
    setRating(value);
    updateFilters({ minRating: value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      {/* Search */}
      <div className="mb-4">
        <label
          htmlFor="search"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Search
        </label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search products..."
        />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Category
        </label>
        <select
          id="category"
          value={filters.categoryId || ""}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price Range
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: Number(e.target.value) })
            }
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
          <span>to</span>
          <input
            type="number"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: Number(e.target.value) })
            }
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
        <button
          onClick={handlePriceChange}
          className="mt-2 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded-md text-sm"
        >
          Apply
        </button>
      </div>

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Minimum Rating
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleRatingChange(value)}
              className={`text-2xl ${
                value <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Reset Filters */}
      <button
        onClick={() => {
          updateFilters({
            categoryId: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            minRating: undefined,
            search: undefined,
          });
          setSearchTerm("");
          setPriceRange({ min: 0, max: 1000 });
          setRating(0);
        }}
        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm"
      >
        Reset Filters
      </button>
    </div>
  );
}
