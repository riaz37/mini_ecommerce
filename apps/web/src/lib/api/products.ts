//@ts-nocheck
import { apiClient } from "./client";
import { Product, ProductFilters } from "@/lib/types";

export async function getProducts(filters: ProductFilters = {}) {
  // Convert filters to query parameters
  const queryParams = new URLSearchParams();

  if (filters.categoryId) {
    queryParams.append("categoryId", filters.categoryId);
  }

  if (filters.search) {
    queryParams.append("search", filters.search);
  }

  if (filters.minPrice !== undefined) {
    queryParams.append("minPrice", filters.minPrice.toString());
  }

  if (filters.maxPrice !== undefined) {
    queryParams.append("maxPrice", filters.maxPrice.toString());
  }

  if (filters.sortBy) {
    queryParams.append("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    queryParams.append("sortOrder", filters.sortOrder);
  }

  if (filters.page) {
    queryParams.append("page", filters.page.toString());
  }

  if (filters.limit) {
    queryParams.append("limit", filters.limit.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

  const products = await apiClient(endpoint);
  
  // Add inStock property to each product based on stock value
  return products.map(product => ({
    ...product,
    inStock: product.inStock !== undefined ? product.inStock : (product.stock > 0)
  }));
}

export async function getProductById(id: string): Promise<Product> {
  const product = await apiClient(`/products/${id}`);
  
  // Add inStock property based on stock value if it doesn't exist
  if (product.inStock === undefined && product.stock !== undefined) {
    product.inStock = product.stock > 0;
  }
  
  return product;
}

export async function getProductRatings(productId: string) {
  return await apiClient(`/products/${productId}/ratings`);
}

export async function rateProduct(
  productId: string,
  data: { rating: number; comment?: string },
) {
  return await apiClient(`/products/${productId}/ratings`, {
    method: "POST",
    body: data,
    requireAuth: true,
  });
}

export async function getFeaturedProducts() {
  return await apiClient("/products?featured=true");
}

export async function getNewArrivals() {
  return await apiClient("/products?sort=createdAt&order=desc&limit=8");
}

export async function getBestSellers() {
  return await apiClient("/products?sort=sales&order=desc&limit=8");
}
